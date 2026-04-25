import bcrypt from "bcryptjs";

self.onmessage = (e: MessageEvent<string[]>) => {
  const hashes = e.data.map((pw) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(pw, salt);
  });
  self.postMessage(hashes);
};
