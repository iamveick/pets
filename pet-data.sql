USE pet_management;

INSERT INTO owners (first_name, last_name, contact_email)
VALUES 
('Alice', 'Williams', 'alice.williams@example.com'),
('Bob', 'Jones', 'bob.jones@example.com'),
('Charlie', 'Brown', 'charlie.brown@example.com');

INSERT INTO pet_types (type_name)
VALUES 
('Dog'),
('Cat'),
('Parrot');

INSERT INTO pets (pet_name, age, owner_id, type_id)
VALUES 
('Max', 4, 1, 1),
('Luna', 2, 2, 2),
('Kiwi', 1, 3, 3),
('Buddy', 3, 1, 1),
('Milo', 5, 2, 2),
('Sunny', 2, 3, 3);