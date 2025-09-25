import { Sequelize } from 'sequelize';
export const sequelize = new Sequelize({
  database: 'swiftslot_chibusonma',
  username: 'root',        
  password: '',            
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log,   
});

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Unable to connect to database:', error);
  }
}