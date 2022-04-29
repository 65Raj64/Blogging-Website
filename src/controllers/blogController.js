const authorModel = require("../models/authorModel");
const blogModel = require('../models/blogModel')
const mongoose=require("mongoose")
const objectId =mongoose.Types.ObjectId


//2. Create a blog
const createBlog = async function (req, res) {
    try {
        let data = req.body
        let authorData = await authorModel.findById(data.authorId)
        if (!authorData)
            return res.status(400).send({ status: false, msg: "Enter valid author ID" })
        if (data.isPublished)
            data["publishedAt"] = new Date();
        const createdBlog = await blogModel.create(data)
        res.status(201).send({ status: true, msg: createdBlog })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


//3. Get all not deleted and published blogs which can also be filtered by query parameter/s.
const getBlog = async function (req, res) {
    try {
        let query = req.query
        let mainQuery = [{ authorId: query.authorId }, { category: query.category }, { tags: query.tags }, { subcategory: query.subcategory }]

        //when query has authorId, validate authorId
        if(query.authorId && !(objectId.isValid(query.authorId))) 
        return res.send({status:false, msg:"authorId is invalid"})
        
        let obj = { isDeleted: false, isPublished: true, $or: mainQuery }
        let getData = await blogModel.find(obj).collation({ locale: "en", strength: 2 })
        let keys = Object.keys(query)
        let temp = 0;

        //when no query is given
        if (keys.length === 0)
            getData = await blogModel.find({ isDeleted: false, isPublished: true })

        //when query parametrs have attribute other than authorId,category,tags or subcategory
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] == "authorId" || keys[i] == "category" || keys[i] == "tags" || keys[i] == "subcategory")
                temp++;
        }
        if (keys.length > 0 && temp === 0)
            return res.status(400).send({ status: false, msg: "Invalid Request!!" })

        //no data found - matching filters
        if (getData.length === 0)
            return res.status(404).send({ status: false, msg: "Blogs not present" })

        res.status(200).send({ status: true, msg: getData })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

//4. Update blog by changing its title, body, adding tags, adding a subcategory
const updateData = async function (req, res) {
    try {
        let Id = req.params.blogId
        let bodyData = req.body
        let updateQuery = { title: bodyData.title, category: bodyData.category, isPublished: true, publishedAt: new Date() }
        let addQuery = { tags: bodyData.tags, body: bodyData.body }
        let blogId = await blogModel.findById(Id)

        if (!blogId)
            return res.status(404).send({ status: false, msg: "Blog not present" })
        if (blogId.isDeleted)
            return res.status(404).send({ status: false, msg: "Blog is Deleted" })

        let getData = await blogModel.findOneAndUpdate({ _id: Id }, { $set: updateQuery, $push: addQuery }, { new: true, upsert: true })

        res.status(200).send({ status: true, msg: getData })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

//5. Delete blog by blogId given as path parameter
const deleteBlog = async function (req, res) {
    try {
        let Blogid = req.params.blogId
        let findData = await blogModel.findById(Blogid)
        if (!findData)
            return res.status(404).send({ status: false, message: "no such blog exists" })
        if (findData.isDeleted)
            return res.status(400).send({ status: false, msg: "Blog is already deleted" })
        let deletedata = await blogModel.findOneAndUpdate({ _id: Blogid }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true, upsert: true })
        res.status(200).send({ status: true, msg: deletedata })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

//6. Delete blogs by query parameters
const deleteBlogByQuery = async function (req, res) {
    try {
        let query = req.query
        let mainQuery = [{ authorId: query.authorId }, { category: query.category }, { tags: query.tags }, { subcategory: query.subcategory }]
        let obj = { isDeleted: false, isPublished: false, $or: mainQuery }
        let findData = await blogModel.find(obj).collation({ locale: "en", strength: 2 })
        if (findData.length === 0)
            return res.status(404).send({ status: false, message: "no such blogs exists / the blogs you are looking for are already deleted or published" })
        let deletedData = await blogModel.updateMany(obj, { $set: { isDeleted: true, deletedAt: new Date() } }, { upsert: true })
        res.status(200).send({ status: true, msg: deletedData })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}


module.exports = { createBlog, getBlog, deleteBlog, deleteBlogByQuery, updateData }