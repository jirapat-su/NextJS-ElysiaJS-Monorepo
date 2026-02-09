import Elysia from 'elysia';
import { generalRouter } from './general/general.router';

export const appRouter = new Elysia({ name: 'app-router' }).use(generalRouter);
