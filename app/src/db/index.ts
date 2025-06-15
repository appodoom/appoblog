import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@db:5432/${process.env.POSTGRES_DB}`
);

export async function authenticateDb() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    // await sequelize.sync({ alter: true, force: true });
    console.log("[CONNECTED] Connection has been established successfully.");
  } catch (error: any) {
    console.log("[ERROR] Unable to connect to the database:", error.message);
    process.exit(1);
  }
}
