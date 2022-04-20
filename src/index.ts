import * as path from 'path';
import * as dotenv from 'dotenv';
import { ServiceContainer } from "./services/data/serviceContainer";
import express from 'express';
import configureClientApi from './clientApi';
import configureBotApi, { configureAdapter } from './botApi';
import configureNotificationApi from './utilityApi';

// Read config from our .env file
const env_file = path.join(__dirname, "..", ".env");
dotenv.config({path: env_file});

// Setup express
const app = express();

// Configure CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
});

// Allow express to read json content
app.use(express.json());

// Setup our static web content
const staticViewsPath = path.join(__dirname, "..", "src\\StaticViews");
app.use("/StaticViews", express.static(staticViewsPath));

// Create our cloud adapter
// This is what is used to tal to the bot service API
const adapter = configureAdapter();

// Configure our services
const services = new ServiceContainer(adapter);

// Load sample data
const sampleDataPath = path.join(__dirname, "..", "src\\sampleData");
services.loadData(sampleDataPath);

// Load adaptive card templates
const templatesPath = path.join(__dirname, "..", "src\\templates");
services.loadTemplates(templatesPath);

// Configure our APIs
configureBotApi(app, services, adapter);
configureClientApi(app, services);
configureNotificationApi(app, services, adapter);

const port = process.env.port || process.env.PORT || 3978;

// Start the server
app.listen(port, () => {
    console.log(`\nListening to ${ port }`);
});