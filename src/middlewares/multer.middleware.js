import multer from "multer";

import { v4 as uuid } from "uuid";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const id = uuid();
    const extName = file.originalname.split(".").pop();
    cb(null, `${id}.${extName}`);
  },
});

export const upload = multer({
  storage,
});
