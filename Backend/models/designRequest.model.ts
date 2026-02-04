import mongoose from 'mongoose';
import { getBaseSchemaOptions, addCommonVirtuals, addBaseIndexes } from '../utils/baseModel';

const designRequestSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        images: [{
            type: String,
            required: true
        }],
        description: {
            type: String,
            trim: true,
        },
        colors: {
            type: String, // Or Array of Strings if we want strict selection
            trim: true
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'paid', 'completed', 'rejected'],
            default: 'pending',
        },
        adminComments: {
            type: String,
        },
        cost: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        designFile: {
            type: String, // URL to the final downloadable file
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending',
        }
    },
    getBaseSchemaOptions('designRequests')
);

addBaseIndexes(designRequestSchema);
addCommonVirtuals(designRequestSchema);

export default mongoose.model('DesignRequest', designRequestSchema);
