CREATE DATABASE dragonbay;
\c dragonbay
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    email TEXT UNIQUE NOT NULL,
    password_hash VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE Listings (
    listing_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    listing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category TEXT,
    is_auction BOOLEAN DEFAULT FALSE,
    auction_end_date TIMESTAMP,
    status TEXT DEFAULT 'available'
);
CREATE TABLE Photos (
    photo_id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES Listings(listing_id),
    photo_url TEXT NOT NULL
);
CREATE TABLE Tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name TEXT UNIQUE NOT NULL
);
CREATE TABLE ListingTags (
    listing_id INT REFERENCES Listings(listing_id),
    tag_id INT REFERENCES Tags(tag_id),
    PRIMARY KEY (listing_id, tag_id)
);