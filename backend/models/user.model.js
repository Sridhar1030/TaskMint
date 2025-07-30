import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userShema = new mongoose.Schema(
    {
        username: {
            type: String,
            trim: true,
            index: true,
            sparse: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        fullName: {
            type: String,
            trim: true,
            index: true,
            sparse: true
        },
        password: {
            type: String,
            required: function() {
                return this.userType === 'custom';
            }
        },
        userType: {
            type: String,
            enum: ['custom', 'gmail'],
            required: true,
            default: 'custom'
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
        writeConcern: {
            w: 'majority',
            j: true,
            wtimeout: 10000
        }
    }
);

userShema.pre("save", function (next) {
    if (!this.isModified("password") || this.userType === 'gmail') return next();

    this.password = bcrypt.hashSync(this.password, 10);
    next();
});

userShema.methods.checkPassword = async function (password) {
    if (this.userType === 'gmail') return true;
    return await bcrypt.compare(password, this.password);
};

userShema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            userType: this.userType
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userShema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userShema);