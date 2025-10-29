import {NextResponse} from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export async function GET() {
  try{
    const data = await redis.hgetall("prices");
    
    const result: Record<string, any> = {};

    for(const symbol in data){
      const jsonData = data[symbol];
      result[symbol] = JSON.parse(jsonData);
    }

        return NextResponse.json(result);


  }catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({error: 'Internal Server Error'}, {status: 500});
  }
}