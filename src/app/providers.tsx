'use client';

import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react';
import { useServerInsertedHTML } from 'next/navigation';
import { useState } from 'react';

const theme = extendTheme({
    config: {
        initialColorMode: 'dark',
        useSystemColorMode: false,
    },
    colors: {
        brand: {
            50: '#ffe5e5',
            100: '#fbb8b8',
            200: '#f58a8a',
            300: '#f05c5c',
            400: '#eb2e2e',
            500: '#d21414',
            600: '#a40f0f',
            700: '#750a0a',
            800: '#470505',
            900: '#1c0000',
        },
    },
    styles: {
        global: {
            body: {
                bg: 'gray.900',
                color: 'white',
            },
        },
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    const [cache] = useState(() => {
        const cache = createCache({ key: 'css' });
        cache.compat = true;
        return cache;
    });

    useServerInsertedHTML(() => {
        return (
            <style
                data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(' ')}`}
                dangerouslySetInnerHTML={{
                    __html: Object.values(cache.inserted).join(' '),
                }}
            />
        );
    });

    return (
        <CacheProvider value={cache}>
            <ChakraProvider theme={theme}>
                {children}
            </ChakraProvider>
        </CacheProvider>
    );
}
