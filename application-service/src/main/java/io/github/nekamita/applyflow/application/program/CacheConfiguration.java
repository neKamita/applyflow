package io.github.nekamita.applyflow.application.program;

import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;

/**
 * Values are stored as typed JSON rather than Java serialization: readable with redis-cli, and safe to
 * read after a class changes (a Java-serialized value would fail to deserialize).
 */
@Configuration(proxyBeanMethods = false)
class CacheConfiguration {

    @Bean
    RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory,
                                   @Value("${applyflow.cache.program-ttl:PT10M}") Duration ttl) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(ttl)
                .prefixCacheNameWith("applyflow:")
                .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaults)
                .withInitialCacheConfigurations(Map.of(
                        ProgramService.PROGRAM_CACHE, defaults.serializeValuesWith(
                                SerializationPair.fromSerializer(new JacksonJsonRedisSerializer<>(ProgramView.class))),
                        ProgramService.CATALOG_CACHE, defaults.serializeValuesWith(
                                SerializationPair.fromSerializer(new JacksonJsonRedisSerializer<>(ProgramCatalog.class)))))
                .enableStatistics()
                .build();
    }
}
