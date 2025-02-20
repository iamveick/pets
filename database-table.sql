-- Create the database
CREATE DATABASE pet_management;
USE pet_management;

-- Create the owners table
CREATE TABLE owners (
    owner_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    contact_email VARCHAR(100)
);

-- Create the pet_types table
CREATE TABLE pet_types (
    type_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(20) NOT NULL
);

-- Create the pets table
CREATE TABLE pets (
    pet_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pet_name VARCHAR(50) NOT NULL,
    age TINYINT NOT NULL,
    owner_id INT UNSIGNED,
    type_id INT UNSIGNED,
    FOREIGN KEY (owner_id) REFERENCES owners(owner_id),
    FOREIGN KEY (type_id) REFERENCES pet_types(type_id)
);