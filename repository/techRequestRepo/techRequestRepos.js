const techRequestModel = require('../../module/techRequest/tecReqeust');
const ReqModel = require('../../module/reuqestsSchema/request');
const userRepository = require('../../repository/userRepository/userRepos');
const Offer = require('../../module/offersSchema/offer');
const { ObjectId } = require("mongodb");


const getReqById = async (technicalID) => {
    try {
        const techReqs = await techRequestModel.find({ technicalID: technicalID });
        return techReqs;
    } catch (error) {
        console.error('Error fetching TechRequests by technicalID:', error);
        throw error; // Rethrow or handle as needed
    }
};





const gettAlltechSchema = async () => {
    try {
        const allTechReq = await techRequestModel.find();
        return allTechReq;
    } 
    catch {
        return false;
    }
};


const deletetechSchema = async technicalID => {
    try {
        const deletedTech = await techRequestModel.findOneAndDelete({technicalID});
        return true;
    } 
    catch {
        return false;
    }
};


const addRequest = async requestData => {
    try {
        const newReq = new techRequestModel(requestData);
        await newReq.save();
        return newReq;
    } 
    catch {
        return false;
    }
};





const getData = async technicalID => {
    try {
        const requestTech = await techRequestModel.find({ technicalID });//requestID+technicalID
        const requestUser = await ReqModel.find(requestTech.requestID);

        const helpseekerPromises = requestUser.map(request => {
         return userRepository.getUserByID(request.helpseekerId);
       });
         const helpseekers = await Promise.all(helpseekerPromises);
         const offers = await Offer.find({technicalID});
        return {requestTech,helpseekers,requestUser,offers};
    } 
    catch{
        return false;
    }
};


const deleteRequestsByRequestId = async (requestID) => {
    try {
        const result = await techRequestModel.deleteMany({ requestID });
        return result;
    } catch (error) {
        console.error(error);
        return false;
    }
};


const deletebyReqIdTechId = async (requestID,technicalID) => {
    try {
        
        requestID = new ObjectId(requestID);
        technicalID = new ObjectId(technicalID);
          const query = { requestID: requestID, technicalID: technicalID };
          const result = await techRequestModel.findOneAndDelete(query);
          return result;
    } catch (error) {
        console.error(error);
        return false;
    }
}

module.exports = {
    getReqById,
    deletetechSchema,
    gettAlltechSchema,
    addRequest,
    getData,
    deleteRequestsByRequestId,
    deletebyReqIdTechId
};



















// const techRequestModel = require('../../module/techRequest/tecReqeust');
// const ReqModel = require('../../module/reuqestsSchema/request');
// const userRepository = require('../../repository/userRepository/userRepos');
// const Offer = require('../../module/offersSchema/offer');
// const { ObjectId } = require("mongodb");


// const getReqById = async (technicalID) => {
//     try {
//         const techReqs = await techRequestModel.find({ technicalID: technicalID });
//         return techReqs;
//     } catch (error) {
//         console.error('Error fetching TechRequests by technicalID:', error);
//         throw error; // Rethrow or handle as needed
//     }
// };






// const gettAlltechSchema = async () => {
//     try {
//         const allTechReq = await techRequestModel.find();
//         return allTechReq;
//     } 
//     catch {
//         return false;
//     }
// };


// const deletetechSchema = async technicalID => {
//     try {
//         const deletedTech = await techRequestModel.findOneAndDelete({technicalID});
//         return true;
//     } 
//     catch {
//         return false;
//     }
// };


// const addRequest = async requestData => {
//     try {
//         const newReq = new techRequestModel(requestData);
//         await newReq.save();
//         return newReq;
//     } 
//     catch {
//         return false;
//     }
// };





// const getData = async technicalID => {
//     try {
//         const requestTech = await techRequestModel.find({ technicalID });//requestID+technicalID
//         const requestUser = await ReqModel.find(requestTech.requestID);

//         const helpseekerPromises = requestUser.map(request => {
//          return userRepository.getUserByID(request.helpseekerId);
//        });
//          const helpseekers = await Promise.all(helpseekerPromises);
//          const offers = await Offer.find({technicalID});
//         return {requestTech,helpseekers,requestUser,offers};
//     } 
//     catch{
//         return false;
//     }
// };


// const deletebyReqIdTechId = async (requestID,technicalID) => {
//     try {
        
//         requestID = new ObjectId(requestID);
//         technicalID = new ObjectId(technicalID);
//           const query = { requestID: requestID, technicalID: technicalID };
//           const result = await techRequestModel.findOneAndDelete(query);
//           return result;
//     } catch (error) {
//         console.error(error);
//         return false;
//     }
// };


// module.exports = {
//     getReqById,
//     deletetechSchema,
//     gettAlltechSchema,
//     addRequest,
//     getData,
//     deletebyReqIdTechId
// };