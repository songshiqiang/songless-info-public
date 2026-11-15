import type { APIRoute } from 'astro';
import { poolShards } from '../../../data/songs';

export function getStaticPaths() {
  return Object.keys(poolShards).map((shard) => ({ params: { shard } }));
}

export const GET: APIRoute = ({ params }) => new Response(JSON.stringify(poolShards[params.shard!]));
