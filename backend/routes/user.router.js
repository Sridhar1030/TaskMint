import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
	loginUser,
	logoutUser,
	registerUser,
} from "../controllers/auth.controller.js";

const userRouter = Router();

//test
userRouter.route("/test").get((req, res) => {
	res.send("auth api is working");
});
userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").get(verifyJWT, logoutUser);

export { userRouter };
