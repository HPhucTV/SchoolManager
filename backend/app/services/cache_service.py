try:
    import redis
except ImportError:
    redis = None
import json
from typing import Optional, Any
from functools import wraps
from app.config import get_settings

settings = get_settings()

class RedisService:
    def __init__(self):
        self.is_connected = False
        if redis is None:
            print("Redis module not found. Caching disabled.")
            return

        try:
            self.redis = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD,
                decode_responses=True
            )
            # Test connection
            self.redis.ping()
            self.is_connected = True
            print("Redis Connected Successfully")
        except Exception as e:
            print(f"Redis Connection Failed: {e}")
            self.is_connected = False

    def get(self, key: str) -> Optional[str]:
        if not self.is_connected:
            return None
        try:
            return self.redis.get(key)
        except Exception:
            return None

    def set(self, key: str, value: str, expire: int = 300):
        if not self.is_connected:
            return
        try:
            self.redis.set(key, value, ex=expire)
        except Exception:
            pass

    def delete(self, key: str):
        if not self.is_connected:
            return
        try:
            self.redis.delete(key)
        except Exception:
            pass
            
    def invalidate_pattern(self, pattern: str):
        """Delete all keys matching the pattern (e.g., 'users:*')"""
        if not self.is_connected:
            return
        try:
            keys = self.redis.keys(pattern)
            if keys:
                self.redis.delete(*keys)
        except Exception:
            pass

redis_service = RedisService()

def cache(expire: int = 300, key_prefix: str = ""):
    """
    Decorator to cache API responses.
    Key is generated based on prefix + args + kwargs.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Skip caching if Redis is down
            if not redis_service.is_connected:
                return await func(*args, **kwargs)

            # Generate Cache Key
            # Filter out 'db', 'current_user' from kwargs to avoid non-serializable objects in key
            cache_kwargs = {k: v for k, v in kwargs.items() if k not in ['db', 'current_user', 'background_tasks']}
            
            # Simple key generation strategy
            key_parts = [key_prefix]
            for v in cache_kwargs.values():
                key_parts.append(str(v))
            
            cache_key = ":".join(key_parts)
            
            # Try get from cache
            cached_data = redis_service.get(cache_key)
            if cached_data:
                # Assuming data is JSON serializable Pydantic models or dicts
                try:
                    return json.loads(cached_data)
                except:
                    pass
            
            # Call function
            result = await func(*args, **kwargs)
            
            # Serialize result to JSON
            # This requires the result to be simpler types or Pydantic models
            # Pydantic models have .model_dump() or .dict()
            try:
                if isinstance(result, list):
                    to_cache = [item.model_dump() if hasattr(item, 'model_dump') else item for item in result]
                elif hasattr(result, 'model_dump'):
                    to_cache = result.model_dump()
                else:
                    to_cache = result
                
                redis_service.set(cache_key, json.dumps(to_cache), expire=expire)
            except Exception as e:
                print(f"Failed to cache key {cache_key}: {e}")
                
            return result
        return wrapper
    return decorator
