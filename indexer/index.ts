import starter from './starter'

const main = () => {
    starter.startIndexer()
    starter.startWs()
    starter.startSubscriber()
}

main()
