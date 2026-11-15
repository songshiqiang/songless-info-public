import { poolRows } from '../../data/songs';

export const GET = () => new Response(JSON.stringify(poolRows()));
