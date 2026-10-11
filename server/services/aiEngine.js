function analyzeMineData({
    workers = [],
    equipment = [],
    inventory = [],
    environment = [],
    waste = [],
    finance = [],
    compliance = []
}) {
    const alerts = [];
    const recommendations = [];
    const trends = [];
    const businessInsights = [];

    // ==========================================
    // 1. WORKER SAFETY ANALYSIS
    // ==========================================

    const highRiskWorkers = workers.filter(
        (worker) =>
            worker.riskLevel === "High" ||
            worker.riskLevel === "Critical"
    );

    if (highRiskWorkers.length > 0) {
        alerts.push({
            type: "Safety",
            severity: "High",
            title: "High-Risk Workers Detected",
            message:
                highRiskWorkers.length +
                " worker(s) currently have High or Critical risk status.",
            count: highRiskWorkers.length
        });

        recommendations.push({
            category: "Worker Safety",
            priority: "High",
            action:
                "Review high-risk workers, verify PPE, duty assignment and recent safety training."
        });
    }

    const ppeIssues = workers.filter(
        (worker) =>
            worker.ppeStatus &&
            worker.ppeStatus !== "All PPE Verified"
    );

    if (ppeIssues.length > 0) {
        alerts.push({
            type: "Safety",
            severity: "Medium",
            title: "PPE Compliance Issue",
            message:
                ppeIssues.length +
                " worker(s) require PPE verification.",
            count: ppeIssues.length
        });

        recommendations.push({
            category: "PPE",
            priority: "Medium",
            action:
                "Perform PPE verification before affected workers enter active mining zones."
        });
    }

    // ==========================================
    // 2. EQUIPMENT ANALYSIS
    // ==========================================

    const maintenanceIssues = equipment.filter(
        (item) =>
            item.maintenanceStatus &&
            item.maintenanceStatus !== "Up to Date"
    );

    if (maintenanceIssues.length > 0) {
        alerts.push({
            type: "Equipment",
            severity: "High",
            title: "Equipment Maintenance Required",
            message:
                maintenanceIssues.length +
                " equipment item(s) require maintenance attention.",
            count: maintenanceIssues.length
        });

        recommendations.push({
            category: "Equipment",
            priority: "High",
            action:
                "Schedule maintenance for equipment that is overdue or requires inspection."
        });
    }

    const lowFuelEquipment = equipment.filter(
        (item) =>
            typeof item.fuelLevel === "number" &&
            item.fuelLevel < 25
    );

    if (lowFuelEquipment.length > 0) {
        alerts.push({
            type: "Equipment",
            severity: "Medium",
            title: "Low Equipment Fuel",
            message:
                lowFuelEquipment.length +
                " equipment item(s) have fuel below 25%.",
            count: lowFuelEquipment.length
        });

        recommendations.push({
            category: "Fuel",
            priority: "Medium",
            action:
                "Check fuel levels and schedule refueling for low-fuel equipment."
        });
    }

    // ==========================================
    // 3. INVENTORY ANALYSIS
    // ==========================================

    const lowStockItems = inventory.filter(
        (item) =>
            typeof item.quantity === "number" &&
            typeof item.minimumStockLevel === "number" &&
            item.quantity <= item.minimumStockLevel
    );

    if (lowStockItems.length > 0) {
        alerts.push({
            type: "Inventory",
            severity: "Medium",
            title: "Low Inventory Detected",
            message:
                lowStockItems.length +
                " inventory item(s) are at or below minimum stock level.",
            count: lowStockItems.length
        });

        recommendations.push({
            category: "Inventory",
            priority: "Medium",
            action:
                "Review low-stock items and create replenishment requests."
        });
    }

    // ==========================================
    // 4. ENVIRONMENT ANALYSIS
    // ==========================================

    const environmentalRisks = environment.filter(
        (record) =>
            record.riskLevel === "High" ||
            record.riskLevel === "Critical"
    );

    if (environmentalRisks.length > 0) {
        alerts.push({
            type: "Environment",
            severity: "High",
            title: "Environmental Risk Detected",
            message:
                environmentalRisks.length +
                " environmental record(s) have High or Critical risk.",
            count: environmentalRisks.length
        });

        recommendations.push({
            category: "Environment",
            priority: "High",
            action:
                "Inspect affected zones and review air quality, dust, water and environmental protection controls."
        });
    }

    const unusualEnvironmentalChanges = environment.filter(
        (record) => record.unusualChange === true
    );

    if (unusualEnvironmentalChanges.length > 0) {
        alerts.push({
            type: "Environment",
            severity: "Medium",
            title: "Unusual Environmental Change",
            message:
                unusualEnvironmentalChanges.length +
                " environmental record(s) contain unusual changes.",
            count: unusualEnvironmentalChanges.length
        });
    }

    // ==========================================
    // 5. WASTE ANALYSIS
    // ==========================================

    const unusualWaste = waste.filter(
        (record) => record.unusualChange === true
    );

    if (unusualWaste.length > 0) {
        alerts.push({
            type: "Waste",
            severity: "Medium",
            title: "Unusual Waste Generation",
            message:
                unusualWaste.length +
                " waste record(s) show unusual changes.",
            count: unusualWaste.length
        });

        recommendations.push({
            category: "Waste",
            priority: "Medium",
            action:
                "Investigate unusual waste-generation changes and identify possible reuse opportunities."
        });
    }

    const reusableWaste = waste.reduce(
        (total, record) =>
            total +
            (Number(record.reusableQuantity) || 0),
        0
    );

    if (reusableWaste > 0) {
        businessInsights.push({
            category: "Waste Reuse",
            title: "Waste Reuse Opportunity",
            message:
                reusableWaste +
                " tonnes of recorded material may have reuse potential.",
            impact:
                "Potential reduction in disposal requirements and material procurement."
        });

        recommendations.push({
            category: "Waste Reuse",
            priority: "Medium",
            action:
                "Evaluate reusable waste for internal roads, land rehabilitation and aggregate processing."
        });
    }

    // ==========================================
    // 6. COMPLIANCE ANALYSIS
    // ==========================================

    const complianceIssues = compliance.filter(
        (document) =>
            document.status === "Expired" ||
            document.status === "Expiring Soon" ||
            document.renewalRequired === true
    );

    if (complianceIssues.length > 0) {
        alerts.push({
            type: "Compliance",
            severity: "High",
            title: "Compliance Action Required",
            message:
                complianceIssues.length +
                " compliance document(s) require renewal or review.",
            count: complianceIssues.length
        });

        recommendations.push({
            category: "Compliance",
            priority: "High",
            action:
                "Review expiring documents and initiate renewal or inspection procedures."
        });
    }

    const criticalCompliance = compliance.filter(
        (document) =>
            document.priority === "Critical"
    );

    if (criticalCompliance.length > 0) {
        alerts.push({
            type: "Compliance",
            severity: "Critical",
            title: "Critical Compliance Deadline",
            message:
                criticalCompliance.length +
                " document(s) have Critical priority.",
            count: criticalCompliance.length
        });
    }

    // ==========================================
    // 7. FINANCE ANALYSIS
    // ==========================================

    if (finance.length > 0) {
        const latestFinance = finance[finance.length - 1];

        if (
            latestFinance &&
            latestFinance.budgetStatus &&
            latestFinance.budgetStatus !== "Within Budget"
        ) {
            alerts.push({
                type: "Finance",
                severity: "Medium",
                title: "Budget Variance Detected",
                message:
                    "The latest finance record is " +
                    latestFinance.budgetStatus + "."
            });

            recommendations.push({
                category: "Finance",
                priority: "Medium",
                action:
                    "Review fuel, maintenance and operating expenses for possible cost-control opportunities."
            });
        }

        const totalRevenue = finance.reduce(
            (total, record) =>
                total + (Number(record.revenue) || 0),
            0
        );

        const totalExpenses = finance.reduce(
            (total, record) =>
                total + (Number(record.totalExpenses) || 0),
            0
        );

        const totalProfit = finance.reduce(
            (total, record) =>
                total + (Number(record.profit) || 0),
            0
        );

        businessInsights.push({
            category: "Finance",
            title: "Financial Performance",
            message:
                "Recorded revenue is ₹" +
                totalRevenue.toLocaleString("en-IN") +
                " with total expenses of ₹" +
                totalExpenses.toLocaleString("en-IN") +
                ".",
            impact:
                "Recorded profit across available finance periods is ₹" +
                totalProfit.toLocaleString("en-IN") +
                "."
        });

        if (finance.length >= 2) {
            const previous =
                finance[finance.length - 2];

            const current =
                finance[finance.length - 1];

            const previousExpenses =
                Number(previous.totalExpenses) || 0;

            const currentExpenses =
                Number(current.totalExpenses) || 0;

            if (previousExpenses > 0) {
                const expenseChange =
                    ((currentExpenses -
                        previousExpenses) /
                        previousExpenses) *
                    100;

                if (expenseChange > 5) {
                    trends.push({
                        category: "Finance",
                        direction: "Increasing",
                        title: "Operating Expenses Increasing",
                        message:
                            "Latest recorded expenses increased by " +
                            expenseChange.toFixed(1) +
                            "% compared with the previous period."
                    });
                }
            }
        }
    }

    // ==========================================
    // 8. GENERAL MINE STATUS
    // ==========================================

    const totalAlerts = alerts.length;

    let overallStatus = "Stable";

    if (
        alerts.some(
            (alert) => alert.severity === "Critical"
        )
    ) {
        overallStatus = "Critical Attention Required";
    } else if (
        alerts.some(
            (alert) => alert.severity === "High"
        )
    ) {
        overallStatus = "High Attention Required";
    } else if (totalAlerts > 0) {
        overallStatus = "Monitoring Required";
    }

    // ==========================================
    // FINAL RESULT
    // ==========================================

    return {
        generatedAt: new Date().toISOString(),

        overallStatus,

        summary: {
            workers: workers.length,
            equipment: equipment.length,
            inventoryItems: inventory.length,
            environmentalRecords: environment.length,
            wasteRecords: waste.length,
            financeRecords: finance.length,
            complianceDocuments: compliance.length,
            alerts: alerts.length,
            recommendations: recommendations.length
        },

        alerts,

        trends,

        recommendations,

        businessInsights
    };
}

module.exports = {
    analyzeMineData
};