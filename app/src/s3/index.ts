import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";

function createS3Client() {
  const s3 = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
  return s3;
}

async function getS3MarkdownLink(
  key: string,
  s3Client: S3Client
): Promise<string> {
  const bucketName = process.env.AWS_BUCKET_NAME as string;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
}

async function uploadToS3(
  s3: S3Client,
  filePath: string,
  fileName: string,
  mimeType: string
) {
  const fileStream = fs.createReadStream(filePath);

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${fileName}`,
    Body: fileStream,
    ContentType: mimeType,
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);
  } catch (err) {
    throw new Error("Failed to upload file to S3");
  }
}

export { createS3Client, getS3MarkdownLink, uploadToS3 };
