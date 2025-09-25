import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Booking extends Model {
  public id!: number;
  public vendorId!: number;
  public buyerId!: number;
  public startTimeUtc!: Date;
  public endTimeUtc!: Date;
  public status!: 'pending' | 'paid';
  public createdAt!: Date;
}

Booking.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'vendor_id',
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, 
    field: 'buyer_id',
  },
  startTimeUtc: {
    type: DataTypes.DATE(3), 
    allowNull: false,
    field: 'start_time_utc',
  },
  endTimeUtc: {
    type: DataTypes.DATE(3),
    allowNull: false,
    field: 'end_time_utc',
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  sequelize,
  modelName: 'Booking',
  tableName: 'bookings',
  updatedAt: false, 
});