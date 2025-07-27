import mongoose from "mongoose";

const connectDB = async () => {
	const NAME = process.env.MONGO_DB_NAME;

	try {
		const conn = await mongoose.connect(`${process.env.MONGO_URI}/${NAME}`, {
		writeConcern: {
			w: 'majority',
			j: true,
			wtimeout: 10000
		},
		// Add other connection options for better compatibility
		maxPoolSize: 10,
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
	});

		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`fail to connect: ${error.message}`);
		process.exit(1);
	}
};

export { connectDB };
