const { response } = require("express");
const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');//access geocoding service 
const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({ accessToken: mapToken });//start geocoding service by passing access token
module.exports.index = async (req,res) =>{
  const alllistings = await Listing.find({});
  res.render("listings/index.ejs",{alllistings});
};

module.exports.renderNewForm = (req,res) =>{
    res.render("listings/new.ejs");
};

module.exports.showNewListing = async (req,res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path:"reviews", populate:{path : "author"}}).populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for does not exist");
        res.redirect("/listings");
    }else{
        res.render("listings/show.ejs",{listing});
    }
    
};

module.exports.createNewPost = async (req,res) =>{
    // if(!req.body.listings){
    //     throw new ExpressError(400,"Send Valid data for list");
    // }
    // const result = listingSchema.validate(req.body);
    // if(result.error){
    //     throw new ExpressError(400,result.error);
    // }
    const response = await geocodingClient.forwardGeocode({
        query: req.body.listings.location,
        limit: 1 // we want only one object 
        })
        .send()
  
    let url = req.file.path;
    let filename = req.file.filename;
    const newData = req.body.listings; // now here the data will already in Object Format becaz in new.ejs we have give name in key value pair
    const newInsert =  new Listing(newData); 
    // console.log(newInsert);
    newInsert.owner = req.user._id; 
    newInsert.image = {url,filename};
    newInsert.geometry = response.body.features[0].geometry;
    let newpost = await newInsert.save();
    req.flash("success","New Listing Created");
    res.redirect("/listings");
};

module.exports.editPost = async (req,res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist");
        res.redirect("/listings");
    }else{
        let originalImageUrl = listing.image.url;
        originalImageUrl = originalImageUrl.replace("/upload","/upload/h_150,w_280")
        res.render("listings/edit.ejs",{listing,originalImageUrl});
    }
    
};

module.exports.updateListing = async(req,res) =>{
    // if(!req.body.listings){
    //     throw new ExpressError(400,"Send Valid data for list");
    // 
    
    let {id} = req.params;
    let listing = await Listing.findByIdAndUpdate(id,{...req.body.listings });
    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url,filename};
        await listing.save();
    }
    req.flash("success","Listing Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req,res) =>{
    let {id} = req.params;
    let a = await Listing.findByIdAndDelete(id);
    // console.log(a);
    req.flash("success","Listing Deleted");
    res.redirect("/listings");
};