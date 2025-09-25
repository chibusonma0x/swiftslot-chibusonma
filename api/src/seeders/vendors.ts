import { Vendor } from '../models/Vendor';
export async function seedVendors() {
  try {
    console.log('Seeding vendors...');
    
    const vendorCount = await Vendor.count();
    if (vendorCount > 0) {
      console.log('Vendors already exist, skipping seed');
      return;
    }

    const vendors = await Vendor.bulkCreate([
      { name: 'Maes Dining', timezone: 'Africa/Lagos' },
      { name: 'Arike Preorder', timezone: 'Africa/Lagos' },
      { name: 'Simi Stitches', timezone: 'Africa/Lagos' },
    ]);

    console.log(`Successfully seeded ${vendors.length} vendors`);
    return vendors;
  } catch (error) {
    console.error('Error seeding vendors:', error);
    throw error;
  }
}
