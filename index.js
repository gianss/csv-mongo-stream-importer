import { createReadStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { WritableStream, TransformStream } from 'node:stream/web'
import csvtojson from 'csvtojson'
import { MongoClient } from 'mongodb'

const url = 'mongodb://localhost:27017' // Altere conforme necessário
const dbName = 'stream'
const collectionName = 'animes';

(async () => {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true })

    try {
        await client.connect()

        const db = client.db(dbName)
        const collection = db.collection(collectionName)
        await collection.drop()
        await client.withSession(async (session) => {
            const dataStream = Readable.toWeb(createReadStream('./animeflv.csv'))
                .pipeThrough(Transform.toWeb(csvtojson()))
                .pipeThrough(new TransformStream({
                    transform(chunk, controller) {
                        const data = JSON.parse(Buffer.from(chunk))
                        controller.enqueue(data)
                    }
                }))

            let items = 0
            await dataStream
                .pipeTo(new WritableStream({
                    async write(chunk) {
                        items++
                        await session.withTransaction(async () => {
                            await collection.insertOne(chunk)
                        })
                    },
                }))

            console.log(`Inseridos ${items} registros no banco de dados.`)
        })
    } catch (error) {
        console.error(error)
        console.error('Erro interno do servidor.')
        process.exit(1)
    } finally {
        await client.close()
        process.exit(0)
    }
})()
