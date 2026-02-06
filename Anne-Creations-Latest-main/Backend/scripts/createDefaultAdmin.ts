import { connectMongoDB } from '../config/db';
import Customer from '../models/customer.model';
import { hashPassword } from '../utils/passwordUtils';
import mongoose from 'mongoose';

const createDefaultAdmin = async () => {
    try {
        await connectMongoDB();
        console.log('Connected to MongoDB');

        const email = 'admin@gmail.com';
        const password = 'admin@123';

        let customer = await Customer.findOne({ email });

        if (customer) {
            console.log('User admin@gmail.com already exists. Updating password...');
            const { hashedPassword, salt } = await hashPassword(password);
            customer.password = hashedPassword;
            customer.salt = salt;
            customer.status = true; // Ensure active
            await customer.save();
            console.log('Password updated successfully.');
        } else {
            console.log('Creating new user admin@gmail.com...');
            const { hashedPassword, salt } = await hashPassword(password);

            const newCustomer = new Customer({
                firstName: 'Admin',
                lastName: 'User',
                email: email,
                password: hashedPassword,
                salt: salt,
                mobile: '9999999999', // Dummy mobile
                status: true,
                emailVerified: true,
                mobileVerified: true,
                languageId: null // or handle if required
            });

            await newCustomer.save();
            console.log('User created successfully.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

createDefaultAdmin();
