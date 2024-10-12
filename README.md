# Keg Avakian Fetch Backend Assignment

## Description
This project is an API designed to store, track, and spend a single user's points for Fetch rewards. This API also is designed to keep track of which payers have point balances, and follow specific rules for which points to spend when.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation](#installation-and-running)

---

### Prerequisites
- **Node.js** To properly run this project, ensure you have Node.js v18 or higher installed. If you do not, you can download and install Node.js [HERE](https://nodejs.org/en/download/prebuilt-installer/). If prompted, be sure to say yes to add it to PATH.

## Environment Variables
You will need to include a `.env` file in the project directory in order to access the database. This file includes a private connection string to restrict third-party access to the database. For security purposes, the .env file will not be included in the GitHub repository. Rather, I have submitted the file alongside the GitHub repository URL. To ensure proper access, simply place the .env file into the project folder (the same folder that contains `db.js`).

## Installation and Running
- Clone this repository through GitHub Desktop, or by running `git clone https://github.com/kegdotcom/fetch-backend-api.git` in the command line on your computer. Alternatively, if you are not using Git, you can download the .zip file of this repository under the `Code` button on GitHub.
- Once you have the project on your local computer, open the command line in the project folder and run: 
  - `npm i` to install all necessary dependencies
  - `npm start` to run the API, where you should see a message indicating that the API is running on port 8000
Now, you can send requests as you need to `http://localhost:8000` to interact with the API.