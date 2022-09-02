import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();

export const dataSource = new DataSource({
  type: 'postgres',
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities: [process.cwd() + '/dist/**/*.entity.js'],
  migrations: [process.cwd() + '/src/migrations/*'],
  synchronize: false,
});

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      return dataSource.initialize();
    },
  },
];
