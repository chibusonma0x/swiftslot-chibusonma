import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Payment extends Model {
  public id!: number;
  public bookingId!: number;
  public ref!: string;
  public status!: 'pending' | 'success' | 'failed';
  public rawEventJson!: string;
}

Payment.init({
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
  ref: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, 
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  rawEventJson: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'raw_event_json',
  },
}, {
  sequelize,
  modelName: 'Payment',
  tableName: 'payments',
  timestamps: false, 
});