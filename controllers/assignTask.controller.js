// const AssignTask = require("../models/assignTask.model");
const mongoose = require("mongoose");
const AccountMaster = require("../models/accountMaster.model");
const Staff = require("../models/staff.model");
const CompanyName = require("../models/companyName.model");
const Party = require("../models/Party.model");
const AssignTask = require("../models/assignTask.model");

exports.createAssignTask = async (req, res) => {
  try {
    const { companyName, partyName, date, time, reasonForVisit, assignTo } = req.body;

    if (!companyName || !partyName || !date || !reasonForVisit || !assignTo) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(companyName) ||
      !mongoose.Types.ObjectId.isValid(partyName) ||
      !mongoose.Types.ObjectId.isValid(assignTo)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    const newAssignTask = new AssignTask({
      companyName,
      partyName,
      date: new Date(date),
      time: time,
      reasonForVisit,
      remarks: req.body.remarks || "",
      assignTo,
      status: req.body.status || "Pending",
      visitDate: req.body.visitDate ? new Date(req.body.visitDate) : null,
      visitTime: req.body.visitTime || "",
      feedback: req.body.feedback || "",
      isRescheduledTask: req.body.isRescheduledTask || false,
      originalTaskId: req.body.originalTaskId || null
    });

    await newAssignTask.save();

    // Fetch AccountMaster using raw ObjectIds before population
    const accountMaster = await AccountMaster.findOne({
      companyName: newAssignTask.companyName, // Use raw ObjectId
      party: newAssignTask.partyName         // Use 'party' field, assuming schema uses 'party'
    })
      .populate("createdBy", "firstName lastName")
      .lean();

    // Populate the task for the response
    const populatedTask = await AssignTask.findById(newAssignTask._id)
      .populate("companyName", "companyName")
      .populate("partyName", "partyName address ownerName personMobileNo")
      .populate("assignTo", "firstName lastName");

    const taskWithCreatedBy = {
      ...populatedTask.toObject(),
      createdBy: accountMaster ? accountMaster.createdBy : null
    };

    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      data: taskWithCreatedBy
    });
  } catch (error) {
    console.error("Error creating assign task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message
    });
  }
};

exports.getAllAssignTasks = async (req, res) => {
  try {
    const tasks = await AssignTask.find()
      .populate({
        path: "companyName",
        // select: "companyName"
      })
      .populate({
        path: "partyName",
        // select: "partyName address ownerName personMobileNo"
      })
      .populate({
        path: "assignTo",
        select: "firstName lastName"
      })
      .populate({
        path: "originalTaskId",
        // select: "date status"
      })
      .sort({ createdAt: -1 });

    // Fetch AccountMaster for each task to get createdBy
    const tasksWithCreatedBy = await Promise.all(
      tasks.map(async (task) => {
        const accountMaster = await AccountMaster.findOne({
          companyName: task.companyName,
          party: task.partyName
        })
          .populate("createdBy", "firstName lastName")
          .lean();

        return {
          ...task.toObject(),
          createdBy: accountMaster ? accountMaster.createdBy : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: tasksWithCreatedBy.length,
      data: tasksWithCreatedBy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message
    });
  }
};

// exports.updateAssignTask = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid task ID"
//       });
//     }

//     const existingTask = await AssignTask.findById(id);
//     if (!existingTask) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found"
//       });
//     }

//     if (updateData.status === "Rescheduled") {
//       if (!updateData.rescheduleDate || isNaN(new Date(updateData.rescheduleDate).getTime())) {
//         return res.status(400).json({
//           success: false,
//           message: "Valid reschedule date required"
//         });
//       }

//       const rescheduleDate = new Date(updateData.rescheduleDate);
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
      
//       if (rescheduleDate < today) {
//         return res.status(400).json({
//           success: false,
//           message: "Reschedule date must be in future"
//         });
//       }

//       // Create new task with rescheduled date
//       const newTask = new AssignTask({
//         companyName: existingTask.companyName,
//         partyName: existingTask.partyName,
//         date: rescheduleDate,
//         time: existingTask.time,
//         reasonForVisit: existingTask.reasonForVisit,
//         remarks: existingTask.remarks,
//         assignTo: existingTask.assignTo,
//         status: "Pending",
//         isRescheduledTask: true,
//         originalTaskId: existingTask._id
//       });

//       await newTask.save();
//     }

//     const updatedTask = await AssignTask.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true
//     })
//     .populate("companyName")
//     .populate("partyName")
//     .populate("assignTo")
//     .populate("originalTaskId");

//     res.status(200).json({
//       success: true,
//       message: "Task updated successfully",
//       data: updatedTask
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to update task",
//       error: error.message
//     });
//   }
// };
 

exports.getAssignTaskById = async (req, res) => {
  try {
    const assignTask = await AssignTask.findById(req.params.id)
      .populate("assignTo")
      .populate({
        path: "originalTaskId",
        select: "date status createdAt" // Add createdAt here
      });
    if (!assignTask) {
      return res.status(404).json({
        success: false,
        message: "Assign task not found",
      });
    }

    const accountMaster = await AccountMaster.findOne({
      companyName: assignTask.companyName,
      party: assignTask.partyName, // Use 'party' to match schema
    })
      .populate("createdBy")
      .populate("party")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...assignTask.toObject(),
        accountDetails: accountMaster,
        rescheduleDate: assignTask.rescheduleDate,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateAssignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 1. Validate task ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID format",
      });
    }

    // 2. Check if task exists
    const existingTask = await AssignTask.findById(id);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // 3. Validate reference fields if they're being updated
    const validateReference = async (field, model, required = false) => {
      if (updateData[field]) {
        if (!mongoose.Types.ObjectId.isValid(updateData[field])) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field} ID format`,
          });
        }
        const doc = await model.findById(updateData[field]);
        if (!doc) {
          return res.status(404).json({
            success: false,
            message: `${field} not found`,
          });
        }
        return true;
      }
      return !required;
    };

    if (updateData.companyName) {
      const isValid = await validateReference('companyName', CompanyName, true);
      if (!isValid) return;
    }

    if (updateData.partyName) {
      const isValid = await validateReference('partyName', Party, true);
      if (!isValid) return;
    }

    if (updateData.assignTo) {
      const isValid = await validateReference('assignTo', Staff, true);
      if (!isValid) return;
    }

    // 4. Date validation and formatting
    if (updateData.date) {
      const date = new Date(updateData.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }
      updateData.date = date;
    }

    if (updateData.visitDate) {
      const visitDate = new Date(updateData.visitDate);
      if (isNaN(visitDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid visit date format",
        });
      }
      updateData.visitDate = visitDate;
    }

    // 5. Time format validation
    if (updateData.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updateData.time)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM (24-hour format)",
      });
    }

    if (updateData.visitTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updateData.visitTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visit time format. Use HH:MM (24-hour format)",
      });
    }

    // 6. Status and rescheduleDate validation
    let originalCreatedAt = existingTask.createdAt; // Default to current task's createdAt
    let populatedNewTask = null; // Initialize populatedNewTask as null
    if (updateData.status) {
      if (!["Pending", "Rescheduled", "Completed", "Cancelled"].includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      if (updateData.status === "Rescheduled") {
        if (!updateData.rescheduleDate || isNaN(new Date(updateData.rescheduleDate).getTime())) {
          return res.status(400).json({
            success: false,
            message: "Reschedule date is required and must be a valid date when status is Rescheduled",
          });
        }

        const rescheduleDate = new Date(updateData.rescheduleDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (rescheduleDate < today) {
          return res.status(400).json({
            success: false,
            message: "Reschedule date must be a future date",
          });
        }
        updateData.rescheduleDate = rescheduleDate;

        // Find the original task's createdAt by tracing back through originalTaskId
        let rootTask = existingTask;
        while (rootTask.isRescheduledTask && rootTask.originalTaskId) {
          rootTask = await AssignTask.findById(rootTask.originalTaskId);
          if (!rootTask) {
            return res.status(404).json({
              success: false,
              message: "Original task not found",
            });
          }
        }
        originalCreatedAt = rootTask.createdAt; // Get the root task's createdAt

        // Create a new task with the rescheduled date
        const newTaskData = {
          companyName: existingTask.companyName,
          partyName: existingTask.partyName,
          date: rescheduleDate,
          time: existingTask.time,
          reasonForVisit: existingTask.reasonForVisit,
          remarks: existingTask.remarks,
          assignTo: existingTask.assignTo,
          status: "Pending",
          isRescheduledTask: true,
          originalTaskId: existingTask._id,
          rescheduleDate: null,
          createdAt: originalCreatedAt, // Explicitly set the original createdAt
        };

        const newTask = new AssignTask(newTaskData);
        await newTask.save();

        // Populate the new task for the response
        populatedNewTask = await AssignTask.findById(newTask._id)
          .populate("companyName", "companyName")
          .populate("partyName", "partyName address ownerName personMobileNo")
          .populate("assignTo", "firstName lastName");
      } else {
        updateData.rescheduleDate = null;
      }
    }

    // Update the original task
    const updatedAssignTask = await AssignTask.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("companyName", "companyName")
      .populate("partyName", "partyName address ownerName personMobileNo")
      .populate("assignTo", "firstName lastName");

    if (!updatedAssignTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found after update",
      });
    }

    // Fetch AccountMaster for createdBy
    const accountMaster = await AccountMaster.findOne({
      companyName: updatedAssignTask.companyName,
      party: updatedAssignTask.partyName,
    })
      .populate("createdBy", "firstName lastName")
      .lean();

    // Format the response
    const responseData = {
      originalTask: {
        ...updatedAssignTask.toObject(),
        createdBy: accountMaster ? accountMaster.createdBy : null,
      },
    };

    // Only include newTask in the response if it was created (i.e., status is Rescheduled)
    if (updateData.status === "Rescheduled" && populatedNewTask) {
      responseData.newTask = {
        message: "New task created with rescheduled date",
        rescheduledDate: updateData.rescheduleDate,
        data: populatedNewTask.toObject(), // Convert to plain object for the response
      };
    }

    res.status(200).json({
      success: true,
      message: updateData.status === "Rescheduled"
        ? "Task rescheduled successfully and new task created"
        : "Task updated successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error updating assign task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task. Please try again.",
      error: error.message || "An unexpected error occurred",
    });
  }
};

exports.updateAssignTaskStatus = async (req, res) => {
  try {
    const { status, rescheduleDate } = req.body;

    if (!["Pending", "Rescheduled", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updateData = { status };
    if (status === "Rescheduled") {
      if (!rescheduleDate || isNaN(new Date(rescheduleDate).getTime())) {
        return res.status(400).json({
          success: false,
          message: "rescheduleDate is required and must be a valid date when status is Rescheduled",
        });
      }
      const rescheduleDateObj = new Date(rescheduleDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (rescheduleDateObj < today) {
        return res.status(400).json({
          success: false,
          message: "rescheduleDate must be a future date",
        });
      }
      updateData.rescheduleDate = rescheduleDateObj;
    } else {
      updateData.rescheduleDate = null;
    }

    const updatedAssignTask = await AssignTask.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("assignTo")
      .lean();

    if (!updatedAssignTask) {
      return res.status(404).json({
        success: false,
        message: "Assign task not found",
      });
    }

    const accountMaster = await AccountMaster.findOne({
      companyName: updatedAssignTask.companyName,
      partyName: updatedAssignTask.partyName,
    })
      .populate("createdBy")
      .lean();

    res.status(200).json({
      success: true,
      message: "Assign task status updated successfully",
      data: { ...updatedAssignTask, accountDetails: accountMaster },
    });
  } catch (error) {
    console.error("Error updating assign task status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update assign task status",
      error: error.message,
    });
  }
};

exports.deleteAssignTask = async (req, res) => {
  try {
    const assignTask = await AssignTask.findByIdAndDelete(req.params.id);
    if (assignTask) {
      res.status(200).json({
        success: true,
        message: "Assign task deleted successfully",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Assign task not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPartyNamesByCompany = async (req, res) => {
  try {
    const { companyName } = req.query;
    if (
      !companyName ||
      !["Sakshi Creation", "Quality Packaging"].includes(companyName)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or missing companyName. Must be 'Sakshi Creation' or 'Quality Packaging'.",
      });
    }

    const accountMasters = await AccountMaster.find({ companyName }).select(
      "partyName"
    );
    const partyNames = accountMasters.map((am) => am.partyName);

    res.status(200).json({
      success: true,
      data: partyNames,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTasksByStaffId = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate staffId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID format",
      });
    }

    // 2. Check if staff exists
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // 3. Fetch tasks assigned to the staff member
    const tasks = await AssignTask.find({ assignTo: id })
      .populate({
        path: "companyName",
        select: "companyName",
      })
      .populate({
        path: "partyName",
        select: "partyName address ownerName personMobileNo",
      })
      .populate({
        path: "assignTo",
        select: "firstName lastName",
      })
      .populate({
        path: "originalTaskId",
        select: "date status",
      })
      .sort({ createdAt: -1 });

    // 4. If no tasks found, return an empty array with a message
    if (!tasks || tasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No tasks found for this staff member",
        count: 0,
        data: [],
      });
    }

    // 5. Fetch AccountMaster for each task to get createdBy
    const tasksWithCreatedBy = await Promise.all(
      tasks.map(async (task) => {
        const accountMaster = await AccountMaster.findOne({
          companyName: task.companyName,
          party: task.partyName,
        })
          .populate("createdBy", "firstName lastName")
          .lean();

        return {
          ...task.toObject(),
          createdBy: accountMaster ? accountMaster.createdBy : null,
        };
      })
    );

    // 6. Return the tasks
    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      count: tasksWithCreatedBy.length,
      data: tasksWithCreatedBy,
    });
  } catch (error) {
    console.error("Error fetching tasks by staff ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};