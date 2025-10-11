// Env Variable must be avaible as soon as our application is first time loaded
import dotenv from "dotenv";
dotenv.config();

import connectDB from './db/index.js';

connectDB()