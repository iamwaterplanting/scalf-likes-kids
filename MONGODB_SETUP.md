# MongoDB Atlas Setup Instructions

Follow these steps to set up MongoDB Atlas for your BetaGames application:

## 1. Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account

## 2. Create a New Cluster

1. Click "Build a Database"
2. Choose the FREE tier option (shared cluster)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure) and region closest to your users
4. Click "Create Cluster" - this may take a few minutes to provision

## 3. Create a Database User

1. In the left sidebar, click "Database Access" under SECURITY
2. Click "Add New Database User"
3. Create a username and password (SAVE THIS PASSWORD SECURELY - you'll need it for your connection string)
4. Set "Database User Privileges" to "Read and write to any database" 
5. Click "Add User"

## 4. Configure Network Access

1. In the left sidebar, click "Network Access" under SECURITY
2. Click "Add IP Address"
3. For development, you can allow access from anywhere by clicking "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)
4. For production, add only the specific IP addresses that need access
5. Click "Confirm"

## 5. Get Your Connection String

1. Go back to "Database" in the sidebar
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string provided
5. Replace `<password>` with your database user's password
6. Replace `<dbname>` with `betagames`

## 6. Update Your .env File

1. Create a file named `.env` in the root of your project
2. Add the following line (replacing with your actual connection string):
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-address>/betagames?retryWrites=true&w=majority
   ```

## 7. Install Required Dependencies

Make sure you have the necessary dependencies installed:

```
npm install mongoose dotenv
```

## 8. Start Your Application

Now you can start your application, which will connect to MongoDB Atlas:

```
npm run start
```

## Additional Information

- The free tier of MongoDB Atlas has some limitations but is sufficient for development and small applications
- Your database will be accessible from anywhere with the correct connection string
- For production use, consider implementing more robust security measures 