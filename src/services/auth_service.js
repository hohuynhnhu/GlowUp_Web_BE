const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user_model");

class AuthService {
  static async signup(data) {
    const existed = await UserModel.getByEmail(data.email);
    if (existed) throw new Error("Email already exists");

    const hashPassword = await bcrypt.hash(data.password, 10);
    const user = await UserModel.create({ ...data, password: hashPassword });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return { ...user, token };
  }

  static async login(data) {
    const user = await UserModel.getByEmail(data.email);
    if (!user) throw new Error("Wrong email or password");

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new Error("Wrong email or password");

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      userId: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      token,
    };
  }
}

module.exports = AuthService;
