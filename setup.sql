-- Drop the database if it already exists
DROP DATABASE IF EXISTS dragonbay;

-- Create the database
CREATE DATABASE dragonbay;

-- Connect to the new database
\c dragonbay

-- Create Users table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_picture_path TEXT
);

-- Create Listings table with auction items
CREATE TABLE Listings (
    listing_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    minimum_bid NUMERIC,
    current_max_bid NUMERIC,
    minimum_increase NUMERIC,
    listing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category TEXT,
    is_auction BOOLEAN DEFAULT FALSE, -- Indicates if listing is for auction
    auction_end_date TIMESTAMP,
    status TEXT DEFAULT 'available',
    winner_id INTEGER
);

-- Create Photos table
CREATE TABLE Photos (
    photo_id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES Listings(listing_id),
    photo_url TEXT NOT NULL
);

-- Create Tags table
CREATE TABLE Tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name TEXT UNIQUE NOT NULL
);

-- Create ListingTags table
CREATE TABLE ListingTags (
    listing_id INT REFERENCES Listings(listing_id),
    tag_id INT REFERENCES Tags(tag_id),
    PRIMARY KEY (listing_id, tag_id)
);

-- Create Bids table to store individual bids for auction listings
CREATE TABLE Bids (
    bid_id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES Listings(listing_id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(user_id),
    bid_amount NUMERIC NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Messages table to store messages between users
CREATE TABLE Messages (
    message_id SERIAL PRIMARY KEY,
    room VARCHAR(100) NOT NULL,
    sender VARCHAR(50) NOT NULL,
    receiver VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    message_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender) REFERENCES Users(username),
    FOREIGN KEY (receiver) REFERENCES Users(username)
);