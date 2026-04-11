import { createAppKit, modal } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { customFuji, networks, projectId, wagmiAdapter } from '../config'

const queryClient = new QueryClient()

/** Above Radix Dialog (z-50) and in-app menus (z-[10000]) so WalletConnect / injected wallets stay usable */
const APPKIT_Z_INDEX = 100_150

let isAppKitInitialized = false

function getMetadataUrl() {
    if (typeof window === 'undefined') return 'https://retropick.app'
    const { origin, protocol } = window.location
    if (protocol === 'http:' || protocol === 'https:') return origin
    return 'https://retropick.app'
}

function initAppKit() {
    if (typeof window === 'undefined' || isAppKitInitialized) return

    createAppKit({
        adapters: [wagmiAdapter],
        networks,
        defaultNetwork: customFuji,
        projectId,
        metadata: {
            name: 'RetroPick',
            description: 'Decentralized Prediction Market',
            url: getMetadataUrl(),
            icons: ['https://avatars.githubusercontent.com/u/179229932'],
        },
        /**
         * Must be false for the default WalletConnect / wallet list modal: when true, AppKit does not
         * append `w3m-modal` to the document, so `open()` has no UI (embedded mode expects you to mount `<w3m-modal>` yourself).
         */
        enableEmbedded: false,
        enableReconnect: false,
        allowUnsupportedChain: true,
        coinbasePreference: 'all',
        /** EOA-first matches typical dapp “connect wallet” (MetaMask, WalletConnect, etc.); smart accounts stay available in AppKit */
        defaultAccountTypes: {
            eip155: 'eoa',
        },
        themeVariables: {
            '--w3m-z-index': APPKIT_Z_INDEX,
            '--apkt-z-index': APPKIT_Z_INDEX,
        },
        features: {
            analytics: true,
            email: false,
            socials: ['google'],
        },
    })

    isAppKitInitialized = true
}

initAppKit()

export function Web3ModalProvider({ children, cookies }: { children: ReactNode; cookies?: string }) {
    /**
     * Pre-warm AppKit before any auth / social action. Google sign-in must open a popup synchronously
     * from the click handler; awaiting inside that handler breaks the user-gesture chain.
     */
    useEffect(() => {
        void modal?.ready().catch(() => undefined)
    }, [])

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig as typeof wagmiAdapter.wagmiConfig} reconnectOnMount={false}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    )
}
