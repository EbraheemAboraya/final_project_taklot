const techRepository = require("../../repository/technicalReoistory/technicalRepos");
const offerRepository = require("../../repository/offerRepository/offerRepos");
const requestRepository = require("../../repository/requestRepostiory/requesRepos");
const userRepository = require("../../repository/userRepository/userRepos");
const techReqRepository = require("../../repository/techRequestRepo/techRequestRepos");
const socketManager = require('../../socketManager'); // Adjust the path to your socketManager module

const {
  saveParameter,
  getParameter,
} = require("../usersController/usersControllers");
const { NotFoundError, BadRequsetError } = require("../../errors/err");

const getOffersPage = async (req, res) => {
  try {
    const technicalID = getParameter("technicalId");
    const { requestTech, helpseekers, requestUser, offers } =
      await techReqRepository.getData(technicalID);
    res.render("techOffersPage", {
      requestTech,
      helpseekers,
      requestUser,
      offers,
    });
  } catch (err) {
    res.status(err?.status || 500).json({ message: err.message });
  }
};

// add new offer
const addOffer = async (req, res) => {
  try {
    const technicalID = getParameter("technicalId");
    const { requestID, bid, comments } = req.body;
    console.log(requestID, bid, comments);

    const new_Offer = await offerRepository.addOffer(
      requestID,
      technicalID,
      bid,
      comments
    );

    const userId = await requestRepository.getHelpSeekerIdByRequestId(requestID);
    // Store the new offer in Redis
    const helpSeekerSocketId=socketManager.getUserSocket(userId);
    // Get the help seeker's socket ID from Redis
    const io = require("../../io").getIO();

    // Emit a socket.io event to notify the help seeker about the new offer
    io.to(helpSeekerSocketId).emit('newOffer', new_Offer);

    if (!new_Offer)
      throw new BadRequsetError(`Technical implement is not true`);
    res.redirect("offers");
  } catch (err) {
    res.status(err?.status || 500).json({ message: err.message });
  }
};

// update offer
const update_offer = async (req, res) => {
  try {
    const technicalID = getParameter("technicalId");
    const { offerID, bid, comments } = req.body;
    const new_Offer = await offerRepository.udpateOffer(offerID, {
      bid,
      comments,
    });
    if (!new_Offer)
      throw new BadRequsetError(`Technical implement is not true`);
    res.redirect("offers");
  } catch (err) {
    res.status(err?.status || 500).json({ message: err.message });
  }
};

const ignoreOffer = async (req, res) => {
  try {
    const technicalID = getParameter("technicalId");
    const { ignoreID } = req.body;
    const ignore = await techReqRepository.deletebyReqIdTechId(
      ignoreID,
      technicalID
    );
    if (!ignore || ignore.length === 0)
      throw new NotFoundError("request not fonud");

    res.status(200).redirect("/techhome/request");
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const { offerID } = req.body;
    const deletedReq = await offerRepository.deleteOffer(offerID);
    if (!deletedReq) throw new BadRequsetError(`error delete offer`);
    res.redirect("/tech/offers");
  } catch (error) {
    throw error;
  }
};

//
const getrequestspage = async (req, res) => {
  try {
    const technicalID = getParameter("technicalId");
    const tech_request = await techReqRepository.getReqById(technicalID);

    let requests = [];
    for (const request of tech_request) {
      const requestID = request.requestID;
      const result = await requestRepository.getReqById(requestID);
      if (result != null) {
        requests.push(result);
      }
    }
    let helpseekers;
    if (requests && requests.length > 0) {

      const helpseekerPromises = requests.map((request) => {
        return userRepository.getUserByID(request.helpseekerId);
      });
      helpseekers = await Promise.all(helpseekerPromises);
      
      let query = req.query.query;
      if (query) {
        const userRequests = [];
        let searchedUser;
        for (const user of helpseekers) {
          if (query === user.fullName) {
            searchedUser = user;
            for (const request of requests) {
              if (request.helpseekerId.toString() === user._id.toString()) {
                userRequests.push(request);
              }
            }
          }
        }
        req.query.query = "";
        requests = userRequests;
        res.render("technicalRequests", { requests, helpseekers });
      }
      res.render("technicalRequests", { requests, helpseekers });
    } else {
      res.render("technicalRequests", { requests, helpseekers });
    }
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

// get profile
const gettechincalprofile = async (req, res) => {
  try {
    res.render("techincalprofile");
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

// get signup page
const getSignup = async (req, res) => {
  try {
    res.render("techSingup");
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

const getTechPage = async (req, res) => {
  try {
    const technicalID = getParameter("technicalId"); // Make sure to retrieve the correct technical ID

    // Calculate revenue from the last month
    const revenueLastMonth = await offerRepository.calculateRevenueLastMonth(
      technicalID
    );

    // Calculate the number of approved offers for the current week
    const approvedOffersCurrentWeek =
      await offerRepository.calculateApprovedOffersCurrentWeek(technicalID);

    // Retrieve the last five offers
    let lastFiveOffers = await offerRepository.getAnyFiveOffers(technicalID);

    // Fetch details for each request associated with the offers, including the help seeker's name
    lastFiveOffers = await Promise.all(
      lastFiveOffers.map(async (offer) => {
        const requestDetails = await requestRepository.getRequestDetailsById(
          offer.requestID
        ); // Fetch additional request details
        const helpSeekerId = await requestRepository.getHelpSeekerIdByRequestId(
          offer.requestID
        );
        // Assuming requestDetails includes a helpseekerId field
        let helpSeekerName = "Name not found"; // Default value if the help seeker's name can't be found
        helpSeekerName = await userRepository.getUserFullName(helpSeekerId);

        // }

        return {
          ...offer, 
          requestDetails: requestDetails || "Details not found",
          helpSeekerName,
        };
      })
    );
    // Render the template with the necessary data
    res.render("technical_index", {
      revenueLastMonth,
      approvedOffersCurrentWeek,
      lastFiveOffers,
      technicalID,
    });
  } catch (err) {
    console.error("Error in getTechPage:", err);
    res.status(err?.status || 500).json({ message: err.message });
  }
};

const getOffers = async (technicalID) => {
  try {
    const offers = await offerRepository.getOffersByTechID(technicalID);
    console.log(offers);
    // const request = await requestRepository.getReqById(offer);

    // const requestIDs = offers.map(offer => offer.requestID.toString());
    return offers;
  } catch (err) {
    throw err;
  }
};

// add new Technical to db
const techincal_post = async (req, res) => {
  try {
    const new_Tech = await techRepository.addTechincal(req.body);
    if (!new_Tech) throw new BadRequsetError(`Technical implement is not true`);
    res.redirect("/login");
  } catch (err) {
    res.status(err?.status || 500).json({ message: err.message });
  }
};

// get all Technical in db
const getTechincalByID = async (req, res) => {
  try {
    const { id } = req.params;
    const tech = await techRepository.getTechincalById(id);
    if (!tech || tech.length === 0) throw new NotFoundError("Technical");
    return res.status(200).send(tech);
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

// update Technical
const techincal_update = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedTec = await techRepository.udpateTechincal(id, req.body);
    if (!updatedTec || updatedTec.length === 0)
      throw new NotFoundError("Technical");
    return res.status(200).send(updatedTec);
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

// delete Technical
const techincal_delete = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTech = await techRepository.deleteTechincal(id);
    if (!deletedTech || deletedTech.length === 0)
      throw new NotFoundError("Technical");
    return res.status(200).send(deletedTech);
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

// get all Technical in db
const getAllTechincal = async (req, res) => {
  try {
    const Tech = await techRepository.getAllTechincal();
    if (!Tech || Tech.length === 0) throw new NotFoundError("Technical");
    return res.status(200).send(Tech);
  } catch (err) {
    return res.status(err?.status || 500).json({ message: err.message });
  }
};

module.exports = {
  techincal_post,
  getTechincalByID,
  techincal_update,
  techincal_delete,
  getAllTechincal,
  getTechPage,
  getOffers,
  deleteOffer,
  getSignup,
  getrequestspage,
  gettechincalprofile,
  addOffer,
  getOffersPage,
  update_offer,
  ignoreOffer,
};
