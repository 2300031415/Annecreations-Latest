import cron from 'node-cron';
import Product from '../models/product.model';
import Order from '../models/order.model';
import mongoose from 'mongoose';

/**
 * Service to handle scheduled tasks
 */
export class SchedulerService {
    /**
     * Initialize all scheduled jobs
     */
    static init() {
        // Run every Sunday at midnight (00:00)
        // '0 0 * * 0'
        // For testing purposes or initial run, you might want to run it more frequently
        // Let's set it to run every Sunday at 00:00 as requested for "weekly"
        cron.schedule('0 0 * * 0', async () => {
            console.log('Running weekly Best Sellers update job...');
            await this.updateWeeklyBestSellers();
        });

        // Run once on startup to ensure data is fresh
        setTimeout(() => {
            console.log('Running initial Best Sellers update...');
            this.updateWeeklyBestSellers();
        }, 10000); // Wait 10 seconds after startup

        console.log('Scheduler Service initialized.');
    }

    /**
     * Updates the weeklySalesCount and isBestSeller flag for all products
     * based on sales from the last 7 days.
     */
    static async updateWeeklyBestSellers() {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // 1. Reset all weekly sales counts and best seller flags
            await Product.updateMany({}, {
                $set: { weeklySalesCount: 0, isBestSeller: false }
            });

            // 2. Aggregate sales from the last 7 days from PAID orders
            const salesData = await Order.aggregate([
                {
                    $match: {
                        orderStatus: 'paid',
                        createdAt: { $gte: sevenDaysAgo }
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        product: '$products.product',
                        optionsCount: {
                            $cond: {
                                if: { $isArray: '$products.options' },
                                then: { $size: '$products.options' },
                                else: 0
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: '$product',
                        weeklySales: { $sum: '$optionsCount' }
                    }
                }
            ]);

            if (salesData.length === 0) {
                console.log('No sales found in the last 7 days.');
                return;
            }

            // 3. Update each product with its weekly sales count
            const updatePromises = salesData.map(item => {
                return Product.findByIdAndUpdate(item._id, {
                    $set: { weeklySalesCount: item.weeklySales }
                });
            });

            await Promise.all(updatePromises);

            // 4. Mark top sellers as Best Sellers
            // Let's say top 20 products with at least 1 sale
            const topSellers = await Product.find({ weeklySalesCount: { $gt: 0 } })
                .sort({ weeklySalesCount: -1 })
                .limit(20)
                .select('_id');

            if (topSellers.length > 0) {
                const topSellerIds = topSellers.map(p => p._id);
                await Product.updateMany(
                    { _id: { $in: topSellerIds } },
                    { $set: { isBestSeller: true } }
                );
                console.log(`Updated ${topSellerIds.length} products as Best Sellers.`);
            }

            console.log('Weekly Best Sellers update completed successfully.');
        } catch (error) {
            console.error('Error updating weekly Best Sellers:', error);
        }
    }
}
