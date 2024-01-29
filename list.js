import { MongoClient } from 'mongodb'

const url = 'mongodb://localhost:27017' // Altere conforme necessário
const dbName = 'stream'
const collectionName = 'animes'

async function listMedicamentos() {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true })

    try {
        await client.connect()

        const db = client.db(dbName)
        const collection = db.collection(collectionName)

        const items = await collection.find({}).toArray()

        console.log('Itens no banco de dados:')
        console.log(items)

    } catch (error) {
        console.error('Erro ao listar medicamentos:', error.message)
    } finally {
        await client.close()
    }
}

listMedicamentos()
