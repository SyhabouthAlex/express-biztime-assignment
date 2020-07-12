const express = require("express")
const router = new express.Router()
const ExpressError = require("../expressError")
const db = require("../db")
 
router.get('/', async function (req, res, next) {
    try {
        const results = await db.query(`SELECT code, name FROM companies`)
        return res.json({companies: results.rows})
    }
    catch(e) {
        next(e)
    }
})

router.get('/:code', async function (req, res, next) {
    try {
        const result = await db.query(`SELECT c.code, c.name, c.description,
        i.id, i.amt, i,paid,
        i.add_date, i.paid_date
        FROM companies as c
        INNER JOIN invoices AS i on (c.code = i.comp_code)
        WHERE code = $1`, [req.params.code])
        if (result.rows.length === 0) {
            throw new ExpressError('Company not found', 404)
        }
        const company = result.rows[0]
        return res.json({company: {code: company.code,
            name: company.name,
            description: company.description,
            invoices : {
                id: company.id,
                amt: company.amt, 
                paid: company.paid,
                add_date: company.add_date,
                paid_date: company.paid_date
            }
        }})
    }
    catch(e) {
        next(e)
    }
})

router.post('/', async function (req, res, next) {
    try {
        const { code, name, description } = req.body;
        if (code === undefined || code.length === 0) {
            throw new ExpressError('Please enter a code', 400)
        }
        if (name === undefined || name.length === 0) {
            throw new ExpressError('Please enter a name', 400)
        }
        const results = await db.query(`INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
        [code, name, description])
        return res.status(201).json({company: results.rows[0]})
    }
    catch(e) {
        next(e)
    }
})

router.put('/:code', async function (req, res, next) {
    try {
        const { name, description } = req.body;
        const result = await db.query(`UPDATE companies SET name=$1, description=$2
        WHERE code = $3
        RETURNING code, name, description`,
        [name, description, req.params.code])
        if (result.rows.length === 0) {
            throw new ExpressError('Company not found', 404)
        }
        return res.json({company: result.rows[0]})
    }
    catch(e) {
        next(e)
    }
})

router.delete('/:code', async function (req, res, next) {
    try {
        const result = await db.query(`DELETE FROM companies
        WHERE code = $1`,
        [req.params.code])
        if (result.rowCount === 0) {
            throw new ExpressError('Company not found', 404)
        }
        return res.json({status: "deleted"})
    }
    catch(e) {
        next(e)
    }
})

module.exports = router;