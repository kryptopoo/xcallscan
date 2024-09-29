'use client'

import { Dropdown, DropdownItem } from 'flowbite-react'
import helper from '@/lib/helper'
import Image from 'next/image'

const MessageFilter = (props) => {
    const dropdownTheme = {
        inlineWrapper: 'flex items-center hover:text-gray-300'
    }

    return (
        <div className="flex flex-row-reverse gap-4 text-white p-1 rounded-md">
            <button className="hover:text-gray-300" onClick={() => props.resetClicked()}>
                Reset
            </button>

            <Dropdown label="Action" inline className="rounded-md " theme={dropdownTheme}>
                <DropdownItem
                    className={` min-w-48 ${props.actionType == '' ? 'bg-gray-100' : ''}`}
                    onClick={() => {
                        props.actionTypeChanged('')
                    }}
                >
                    All Actions
                </DropdownItem>

                {helper.getMsgTypes().map((actType) => {
                    return (
                        <DropdownItem
                            key={actType}
                            className={`min-w-48 ${props.actionType == actType ? 'bg-gray-100' : ''}`}
                            onClick={() => {
                                props.actionTypeChanged(actType)
                            }}
                        >
                            {actType}
                        </DropdownItem>
                    )
                })}
            </Dropdown>

            <Dropdown label="Destination" inline className="rounded-md" theme={dropdownTheme}>
                <DropdownItem
                    className={`min-w-48 ${props.destNetwork == '' ? 'bg-gray-100' : ''}`}
                    onClick={() => {
                        props.destNetworkChanged('')
                    }}
                >
                    All Networks
                </DropdownItem>

                {helper.getNetworks().map((network) => {
                    return (
                        <DropdownItem
                            key={network}
                            className={`min-w-48 ${props.destNetwork == network.id ? 'bg-gray-100' : ''}`}
                            onClick={() => {
                                props.destNetworkChanged(network.id)
                            }}
                        >
                            <Image className="relative inline-block mr-2" alt={network.name} src={network.logo} width={16} height={16} />
                            {network.name}
                        </DropdownItem>
                    )
                })}
            </Dropdown>

            <Dropdown label="Source" inline className="rounded-md" theme={dropdownTheme}>
                <DropdownItem
                    className={`min-w-48 ${props.srcNetwork == '' ? 'bg-gray-100' : ''}`}
                    onClick={() => {
                        props.srcNetworkChanged('')
                    }}
                >
                    All Networks
                </DropdownItem>
                {helper.getNetworks().map((network) => {
                    return (
                        <DropdownItem
                            key={network}
                            className={`min-w-48 ${props.srcNetwork == network.id ? 'bg-gray-100' : ''}`}
                            onClick={() => {
                                // setSrcNetwork(network.id)
                                props.srcNetworkChanged(network.id)
                            }}
                        >
                            <Image className="relative inline-block mr-2" alt={network.name} src={network.logo} width={16} height={16} />
                            {network.name}
                        </DropdownItem>
                    )
                })}
            </Dropdown>
        </div>
    )
}

export default MessageFilter
