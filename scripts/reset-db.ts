import { resetDatabaseFile } from "@/lib/db";

resetDatabaseFile()
  .then(() => {
    console.log("Local salon SQLite database reset.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
