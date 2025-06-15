// PostModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db/index.js";
import { v4 as uuidv4 } from "uuid";

interface PostAttributes {
  uuid: string;
  author: string;
  title: string;
  content: string;
  listOrder: number;
}

type PostCreationAttributes = Optional<PostAttributes, "uuid" | "listOrder">;

class Post
  extends Model<PostAttributes, PostCreationAttributes>
  implements PostAttributes
{
  public uuid!: string;
  public author!: string;
  public title!: string;
  public content!: string;
  public listOrder!: number;
}

Post.init(
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    author: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    listOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
  },
  {
    sequelize,
    tableName: "posts",
    modelName: "Post",
    timestamps: true,
  }
);

export default Post;
