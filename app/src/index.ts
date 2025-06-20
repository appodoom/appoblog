// external imports
import express from "express";
import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

// internal imports
import { protectRoute, uploadMiddleware } from "./middlewares/index.js";
import { authenticateDb } from "./db/index.js";
import { validate, cleanupTempFiles } from "./utils/index.js";
import { Post } from "./models/index.js";
import { createS3Client, getS3MarkdownLink, uploadToS3 } from "./s3/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

(async () => {
  // connect to database
  await authenticateDb();
  const s3 = createS3Client();
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "../templates"));

  // ------------------------------------------------------------
  // web server
  // ------------------------------------------------------------

  app.get("/", protectRoute, async (_req, res) => {
    const posts = await Post.findAll({ order: [["listOrder", "ASC"]] });
    res.render("index", { posts });
  });

  app.get("/post", protectRoute, async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(404).redirect("/404");
    const post = await Post.findOne({ where: { uuid: id as string } });
    if (!post) return res.status(404).redirect("/404");
    res.render("post", { post });
  });

  app.get("/create-post", protectRoute, (_req, res) => {
    res.render("create-post");
  });

  app.get("/edit-post", protectRoute, async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(404).redirect("/404");
    const post = await Post.findOne({ where: { uuid: id as string } });
    if (!post) return res.status(404).redirect("/404");
    res.render("edit-post", { post });
  });

  app.get("/login", (_req, res) => {
    res.render("login");
  });

  app.get("/assets/:postid", protectRoute, async (req, res) => {
    const postId = req.params.postid;
    if (!validate(1, postId)) res.status(404).redirect("/404");
    try {
      const markdownLink = await getS3MarkdownLink(postId, s3);
      if (!validate(1, markdownLink)) return res.status(404).redirect("/404");
      res.status(302).redirect(markdownLink);
    } catch (err: any) {
      console.log(err.message);
      return res.status(404).redirect("/404");
    }
  });

  // -----------------------------------------------------------
  // api
  // -----------------------------------------------------------
  app.post("/login", async (req, res) => {
    const { user, pass } = req.body;
    if (!validate(2, user, pass)) {
      res.status(400).json({ error: "Provide username and password" });
      return;
    }

    if (
      !(await bcrypt.compare(user, process.env.HASHED_USERNAME as string)) ||
      !(await bcrypt.compare(pass, process.env.HASHED_PASSWORD as string))
    ) {
      res.status(400).json({ error: "Wrong combination" });
      return;
    }
    const token = jwt.sign(
      Date.now() as unknown as string,
      process.env.SECRET as string
    );
    res.cookie("t", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 10000 * 60 * 60, // 10 hours
    });

    res.status(200).redirect("/");
  });

  app.post("/create-post", protectRoute, async (req, res) => {
    const { title, author, content } = req.body;
    if (!validate(3, title, author, content)) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    const post = await Post.create({ title, author, content });

    if (!post) res.status(400).json({ error: "Something went wrong" });
    else res.status(200).redirect("/");
  });

  app.post("/delete-post", protectRoute, async (req, res) => {
    const { id } = req.body;
    if (!validate(1, id)) {
      res.status(400).json({ error: "Provide id" });
      return;
    }
    const post = await Post.findOne({ where: { uuid: id as string } });
    if (!post) {
      res.status(400).json({ error: "Could not find post" });
      return;
    }
    await post.destroy();

    res.status(200).redirect("/");
  });

  app.post("/edit-post", protectRoute, async (req, res) => {
    const { id } = req.query;
    const { title, author, content } = req.body;
    if (!validate(4, id as string, title, author, content)) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    const [updatedCount] = await Post.update(
      {
        title,
        author,
        content,
      },
      {
        where: {
          uuid: id as string,
        },
      }
    );
    if (updatedCount === 0) {
      res.status(400).json({ error: "Post not found" });
      return;
    }
    res.status(200).redirect(`/post?id=${id as string}`);
  });

  app.post(
    "/assets",
    protectRoute,
    uploadMiddleware().array("fileUpload", 10),
    async (req, res) => {
      try {
        if (
          !req.files ||
          !(req.files instanceof Array) ||
          req.files.length === 0
        ) {
          res.status(400).json({ error: "No files uploaded." });
          return;
        }
        for (const file of req.files) {
          await uploadToS3(s3, file.path, file.originalname, file.mimetype);
        }
        cleanupTempFiles(req.files);
        res.sendStatus(200);
      } catch (error) {
        res.status(400).json({ error: "Upload error" });
      }
    }
  );

  app.use((_req, res) => res.render("404"));

  app.listen(8000, () => console.log("app is running"));
})();
