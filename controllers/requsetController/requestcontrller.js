const reqRepository = require("../../repository/requestRepostiory/requesRepos");
const techReqRepo = require("../../repository/techRequestRepo/techRequestRepos");
const offerRep = require("../../repository/offerRepository/offerRepos");
const Techincal = require("../../module/technicalDataSchema/techincal");
const TechnicianSocketMapping = require("../../module/technicalCategoryMapping");
const { NotFoundError, BadRequsetError } = require("../../errors/err");
const { getParameter } = require("../usersController/usersControllers");
require("dotenv").config();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const twilio = require("twilio");
const FormData = require("form-data");
const fs = require("fs");
const setupSocket = require("../../sockets/socketManager");
const { server } = require("../../app");
const { notifyTechnicianById } = setupSocket(server);

// Function to send SMS
async function sendSMS(to, body) {
  const client = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const message = await client.messages.create({
      body: body,
      to: to, // Text this number
      from: process.env.TWILIO_PHONE_NUMBER, // From a valid Twilio number
    });
    console.log(`SMS sent! ID: ${message.sid}`);
  } catch (error) {
    console.error(`Failed to send SMS:`, error);
  }
}

async function notifyRelevantTechnicals(matchingTechnicals, newRequest) {
  for (const technical of matchingTechnicals) {
    const msg = {
      to: technical.email, // recipient email from the technical document
      from: "aminw999mn@gmail.com", // Verified sender email in SendGrid
      subject: `New Request Available in ${newRequest.category}`, // Subject line
      text: `Hello ${technical.fullName},\n\nA new request in your category "${newRequest.category}" has been opened. Details: ${newRequest.details}`, // Plain text body
      html: `<p>Hello <b>${technical.fullName}</b>,</p><p>A new request in your category "<b>${newRequest.category}</b>" has been opened. Details: ${newRequest.details}</p>`, // HTML body content
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent to ${technical.fullName}`);

      console.log(
        `Looking for techSocketMapping with technicianId: ${technical._id}`
      );
      const techSocketMapping = await TechnicianSocketMapping.findOne({
        technicianId: technical._id,
      });

      matchingTechnicals.forEach((technician) => {
        notifyTechnicianById(technician._id.toString(), "newRequest", {
          title: `New Request in ${newRequest.category}`,
          message: `A new request in your category "${newRequest.category}" has been opened. Details: ${newRequest.details}`,
          requestId: newRequest._id,
          category: newRequest.category,
          details: newRequest.details,
        }).catch((error) => {
          console.error(
            `Error sending notification to technician ${technician._id}:`,
            error
          );
        });
      });
    } catch (error) {
      console.error(
        `Failed to send notification to ${technical.fullName}:`,
        error
      );
    }
  }
}

// Controller method for uploading image
const request_post = async (req, res) => {
  try {
    // for the update button
    const { req_id, category, details, image } = req.body;
    let data ;
    if (!category){
      data = { details, image };
    }
    else {
     data = { category, details, image };
    }
    if (req_id) {
      const updatedRequset = await reqRepository.updateReqq(req_id, data);
    } else {
      if (req.file && req.file.path) {
        const formData = new FormData();
        formData.append("image", fs.createReadStream(req.file.path));
        // Proceed with sending the file to the Flask app
      } else {
        console.log("No file uploaded.");
      }
      const helpseekerId = getParameter("helpseekerID");

      const matchingTechnicals = await Techincal.find({
        category: category,
      });
      if (matchingTechnicals && matchingTechnicals.length > 0) {
        // Save the image to the database using the repository
        const newReq = await reqRepository.addReq({
          helpseekerId,
          image: {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            image: req.file.buffer,
          },
          category,
          details,
        });


        const io = require('../../io').getIO();
        io.emit("new-request", { category: newReq.category, details: newReq.details }); 

        
        await notifyRelevantTechnicals(matchingTechnicals, newReq);
        const requestID = newReq._id;
        for (const technical of matchingTechnicals) {
          const technicalID = technical._id;
          const chReq = await techReqRepo.addRequest({
            requestID,
            technicalID,
          });
          if (!chReq)
            throw new BadRequsetError(`something is not true in add request`);
        }
      } else {
        console.log("No matching technicals found for category:", category);
      }
    }

    res.redirect("/home/helpseeker/requests");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading image");
  }
};

const renderUploadForm = async (req, res) => {
  try {
    // Assuming 'name' is the field by which you want to retrieve the image
    const imageName = req.params.name; // Assuming the name is passed as a parameter

    // Retrieve the latest uploaded image from MongoDB based on the name
    const latestImage = await req
      .findOne({ filename: imageName })
      .sort({ _id: -1 });

    // Render the upload form along with the latest image data
    res.render("upload", { latestImage: latestImage });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving image");
  }
};

// add new request to db
const getReqPage = async (req, res) => {
  try {
    const userId = getParameter("helpseekerID");
    res.render("Helpseeker-requestform",{userId});
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

// get all request in db
const getReqByID = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await reqRepository.getReqById(id);
    if (!request || request.length === 0) throw new NotFoundError("Request");
    return res.status(200).send(request);
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

// update request
const req_update = async (req, res) => {
  try {
    const userId = getParameter("helpseekerID");
    const requestID = req.body.requestID;
    res.render("Helpseeker-requestform", { requestID ,userId});
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

// delete request
const req_delete = async (req, res) => {
  try {
    const requestId = req.body.requestID;
    const deletedReq = await reqRepository.deleteReq(requestId);
    if (!deletedReq || deletedReq.length === 0)
      throw new NotFoundError("Request");

    const techReq = await techReqRepo.deleteRequestsByRequestId(requestId);
    if (!techReq || techReq.length === 0) throw new NotFoundError("Request");

    const deleteOffer = await offerRep.deleteOfferbyReqId(requestId);


    res.redirect("/home/helpseeker/requests");
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

// get all request in db
const getAllReq = async (req, res) => {
  try {
    const req = await reqRepository.gettAllReq();
    if (!req || req.length === 0) throw new NotFoundError("Request");
    return res.status(200).send(req);
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

module.exports = {
  request_post,
  getReqByID,
  req_update,
  req_delete,
  getAllReq,
  getReqPage,

  // uploadImage,
  renderUploadForm,
};
