import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class BookingSlot extends Model {
  public id!: number;
  public bookingId!: number;
  public vendorId!: number;
  public slotStartUtc!: Date;
}

BookingSlot.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'booking_id',
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'vendor_id',
  },
  slotStartUtc: {
    type: DataTypes.DATE(3),
    allowNull: false,
    field: 'slot_start_utc',
  },
}, {
  sequelize,
  modelName: 'BookingSlot',
  tableName: 'booking_slots',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['vendor_id', 'slot_start_utc'], 
      name: 'unique_vendor_slot'
    }
  ]
});