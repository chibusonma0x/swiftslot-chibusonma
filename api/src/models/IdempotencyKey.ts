import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class IdempotencyKey extends Model {
  public key!: string;
  public scope!: string;
  public responseHash!: string;
  public createdAt!: Date;
}

IdempotencyKey.init({
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
    
  },
  scope: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  responseHash: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'response_hash',  
  },
}, {
  sequelize,
  modelName: 'IdempotencyKey', 
  tableName: 'idempotency_keys',
  updatedAt: false,  
});