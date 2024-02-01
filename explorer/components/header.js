'use client'
import { Dropdown } from 'flowbite-react'
import SearchBar from '@/components/searchbar'
import Image from 'next/image'

export default function Header({ showSearchBar, assets }) {
    assets = assets ?? []

    return (
        <header className="px-4 py-4 xl:px-24 2xl:px-48 w-full bg-gray-50 flex justify-between border-b-[1px]">
            <a className="text-4xl font-semibold flex mb-2 xl:mb-0" href="/">
                <img className="h-6 xl:h-8 mt-2" src="/images/xcall-logo.svg"></img>
                <span className="bg-[#30aaae] text-white  rounded-md text-center text-sm h-5 px-1 xl:text-xl xl:h-7 xl:px-2">Scan</span>
            </a>

            <div className="flex items-center gap-2">
                <div className="xl:flex items-center gap-4 px-2 text-sm hidden">
                    <div
                        x-data="{}"
                        x-init="$nextTick(() => {
                        let ul = $refs.logos;
                        ul.insertAdjacentHTML('afterend', ul.outerHTML);
                        ul.nextSibling.setAttribute('aria-hidden', 'true');
                    })"
                        className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]"
                    >
                        <ul x-ref="logos" className="flex items-center justify-center md:justify-start [&_li]:mx-3 animate-infinite-scroll">
                            {Array.isArray(assets)
                                ? assets.map((asset) => (
                                      <li key={asset.name}>
                                          <div key={asset.name} className="flex gap-1">
                                              <Image src={asset.image} width={20} height={20} className="rounded-full h-[20px] w-[20px]" />
                                              <span>${asset.current_price.toFixed(2)}</span>
                                              <span className={asset.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'}>
                                                  ({asset.price_change_percentage_24h.toFixed(2)}%)
                                              </span>
                                          </div>
                                      </li>
                                  ))
                                : null}
                        </ul>
                    </div>
                </div>

                {showSearchBar ? <SearchBar showFull={false} /> : ''}

                <Dropdown
                    label=""
                    dismissOnClick={false}
                    renderTrigger={() => <Image className="hover:cursor-pointer" src={`/images/network-icon.png`} width={24} height={24} />}
                >
                    <Dropdown.Item>
                        <a href={process.env.TESTNET_APP_URL}>Testnet</a>
                    </Dropdown.Item>
                    <Dropdown.Item>
                        <a href={process.env.MAINNET_APP_URL}>Mainnet</a>
                    </Dropdown.Item>
                </Dropdown>
            </div>
        </header>
    )
}
