# coding: utf-8

class AssetPoint:
    """
    Computes all the data related to the Asset Points objects from frontend module.
    """
    def __init__(self, lng: float, lat: float, largeDirection: float, largeOpening: float, smallDirection: float, smallOpening: float):
        """
        Initialize the AssetPoint class object.

        Args:
            self: AssetPoint object itself
            lng (float): Longitude coordinate of AssetPoint object
            lat (float): Latitude coordinate of AssetPoint object
            largeDirection (float): Angle direction of the Radio Frequency Signal Propagation Large Lobe of the AssetPoint object [from -180° to 180°]
            largeOpening (float): Angle opening of the Radio Frequency Signal Propagation Large Lobe of the AssetPoint object [from -360° to 360°]
            smallDirection (float): Angle direction of the Radio Frequency Signal Propagation Small Lobe of the AssetPoint object [from -180° to 180°]
            smallOpening (float): Angle opening of the Radio Frequency Signal Propagation Small Lobe of the AssetPoint object [from -360° to 360°]
        """
        self.lng = lng
        self.lat = lat
        self.largeDirection = largeDirection
        self.largeOpening = largeOpening
        self.smallDirection = smallDirection
        self.smallOpening = smallOpening

    # setters 
    def setCoords(self, lng: float, lat: float):
        """
        Set the Asset Point class object coordinates.

        Args:
            self: AssetPoint object itself
            lng (float): Longitude coordinate of the AssetPoint object
            lat (float): Latitude coordinate of the AssetPoint object
        """
        self.lng = lng
        self.lat = lat

    def setAssetPointsLobesData(self, largeDirection: float, largeOpening: float, smallDirection: float, smallOpening: float):
        """
        Set the Angles directions and openings Radio Frequency Signal Propagation Large and Small Lobes of the AssetPoint class object 

        Args:
            self: AssetPoint object itself
            largeDirection (float): Angle direction of the Radio Frequency Signal Propagation Large Lobe of the AssetPoint object [from -180° to 180°]
            largeOpening (float): Angle opening of the Radio Frequency Signal Propagation Large Lobe of the AssetPoint object [from -360° to 360°]
            smallDirection (float): Angle direction of the Radio Frequency Signal Propagation Small Lobe of the AssetPoint object [from -180° to 180°]
            smallOpening (float): Angle opening of the Radio Frequency Signal Propagation Small Lobe of the AssetPoint object [from -360° to 360°]
        """
        self.largeDirection = largeDirection
        self.largeOpening = largeOpening
        self.smallDirection = smallDirection
        self.smallOpening = smallOpening

    # getters
    def getCoords(self) -> tuple:
        """
        Get the Asset Point class object coordinates

        Args:
            self: AssetPoint object itself
            
        Returns:
            tuple: AssetPoint Longitude and Latitude coordinates values
        """
        return (self.lng, self.lat)

    def getLargeLobeData(self) -> tuple:
        """
        Get the AssetPoint class object properties of 
        Radio Frequency Signal Propagation Large Lobe angle direction and opening\knee\knee\evaluation.html

        Args:
            self: AssetPoint object itself
            
        Returns:
            tuple: AssetPoint Radio Frequency Signal Propagation Large Lobe Direction and Opening values
        """
        return (self.largeDirection, self.largeOpening)

    def getSmallLobeData(self) -> tuple:
        """
        Get the AssetPoint class object properties of Radio Frequency Signal Propagation Small Lobe angle direction and opening

        Args:
            self: AssetPoint object itself
            
        Returns:
            tuple: AssetPoint Radio Frequency Signal Propagation Small Lobe Direction and Opening values
        """
        return (self.smallDirection, self.smallOpening)

class Antenna:
    """
    Computes all the data related to the Antennas objects from frontend module.
    """
    def __init__(self, lng: float, lat: float, direction: float, opening: float, txPower: float):
        """
        Initialize the Antenna class object.

        Args:
            self: Antenna object itself
            lng (float): Longitude coordinate of Antenna object
            lat (float): Latitude coordinate of Antenna object
            direction (float): Angle direction of the Radio Frequency Signal Propagation Lobe of the Antenna object [from -180° to 180°]
            opening (float): Angle opening of the Radio Frequency Signal Propagation Lobe of the Antenna object [from -360° to 360°]
            txPower (float): Transmission Power of the Radio Frequency Signal Propagation of the Antenna object
        """
        self.lng = lng
        self.lat = lat
        self.direction = direction
        self.opening = opening
        self.txPower = txPower

    # setters
    def setCoords(self, lng: float, lat: float):
        """
        Set the Antenna class object coordinates.

        Args:
            self: Antenna object itself
            lng (float): Longitude coordinate of the Antenna object
            lat (float): Latitude coordinate of the Antenna object
        """
        self.lng = lng
        self.lat = lat

    def setAntennaLobeData(self, direction: float, opening: float):
        """
        Set the Angle direction and opening of the Radio Frequency Signal Propagation Lobe of the Antenna class object

        Args:
            self: Antenna object itself
            direction (float): Angle direction of the Radio Frequency Signal Propagation Lobe of the Antenna object [from -180° to 180°]
            opening (float): Angle opening of the Radio Frequency Signal Propagation Lobe of the Antenna object [from -360° to 360°]
        """
        self.direction = direction
        self.opening = opening

    def setTxPower(self, txPower: float):
        """
        Set the Transmission Power of the Radio Frequency Signal Propagation Lobe of the Antenna class object

        Args:
            self: Antenna object itself
            txPower (float): Transmission Power of the Radio Frequency Signal Propagation of the Antenna object
        """
        self.txPower = txPower

    # getters
    def getCoords(self) -> tuple:
        """
        Get the Antenna class object coordinates

        Args:
            self: Antenna object itself
            
        Returns:
            tuple: Antenna Longitude and Latitude coordinates values
        """
        return (self.lng, self.lat)

    def getLobeData(self) -> tuple:
        """
        Get the Antenna class object properties of Radio Frequency Signal Propagation Lobe angle direction and opening

        Args:
            self: Antenna object itself
            
        Returns:
            tuple: Antenna Radio Frequency Signal Propagation Lobe Direction and Opening values
        """
        return (self.direction, self.opening)

    def getTxPower(self) -> int:
        """
        Get the Antenna class object properties of Radio Frequency Signal Propagation Transmission Power

        Args:
            self: Antenna object itself
            
        Returns:
            int: Value of Antenna Radio Frequency Signal Propagation Lobe Transmission Power 
        """
        return self.txPower

class Anchor:
    """
    Computes all the data related to the Anchors objects from frontend module.
    """
    def __init__(self, lng: float, lat: float):
        """
        Initialize the Anchor class object.

        Args:
            self: Antenna object itself
            lng (float): Longitude coordinate of the Anchor object
            lat (float): Latitude coordinate of the Anchor object
        """
        self.lng = lng
        self.lat = lat

    # setters
    def setCoords(self, lng: float, lat: float):
        """
        Set the Anchor class object coordinates.

        Args:
            self: Anchor object itself
            lng (float): Longitude coordinate of the Anchor object
            lat (float): Latitude coordinate of the Anchor object
        """
        self.lng = lng
        self.lat = lat

    # getters
    def getCoords(self) -> tuple:
        """
        Get the Anchor class object coordinates

        Args:
            self: Anchor object itself
            
        Returns:
            tuple: Anchor Longitude and Latitude coordinates values
        """
        return (self.lng, self.lat)

"""
The Asset Classes Module Documentation.
"""
class GOD:
    """
    Computes all the data from frontend module.
    """

    def __init__(self):
        """
        Initialize the GOD class object.

        Args:
            self: GOD object itself
        """
        self.walls = []
        self.antennas = {}
        self.assetPoints = {}
        self.anchors = {}
        self.algorithms = {}
        self.read_rate = {}
        self.rssi_params = {}
        self.status = {}
        self.mapId = {}
        self.primarySession = None

    def addAssetPoint(self, apName: str, ap: AssetPoint, uuid: str):
        """
        Add an Asset Point to the GOD class object.

        Args:
            self: GOD object itself
            apName (str): The Name property of Asset Point object
            ap (AssetPoint): The new Asset Point object
            uuid (str): Frontend session UUID
        """
        self.assetPoints[uuid][apName] = ap

    def addAntenna(self, antName: str, ant: Antenna, uuid: str):
        """
        Add an Antenna to the GOD class object.

        Args:
            self: GOD object itself
            antName (str): The Name property of Antenna object
            ant (Antenna): The new Antenna object
            uuid (str): Frontend session UUID
        """
        self.antennas[uuid][antName] = ant

    def addAnchor(self, anchorName: str, anchor: Anchor, uuid: str):
        """
        Add an Anchor to the GOD class object.

        Args:
            self: GOD object itself
            anchorName (str): The Name property of Anchor object
            anchor (Anchor): The new Anchor object
            uuid (str): Frontend session UUID
        """
        self.anchors[uuid][anchorName] = anchor

    def updateAssetPoint(self, apArray: list, uuid: str ):
        """
        Update an Asset Point object on the GOD class object.

        Args:
            self: GOD object itself
            apArray (llist): Array of Asset Points objects
            uuid (str): Frontend session UUID
        """
        self.assetPoints[uuid] = {}

        for assetPoint in range(len(apArray)):
            apCoords = apArray[assetPoint]['LongLat']
            largeDirOpen = apArray[assetPoint]['LargeDirOpen']
            smallDirOpen = apArray[assetPoint]['SmallDirOpen']
            if len(self.assetPoints[uuid]) > assetPoint:
                apObject = self.getAssetPoint(assetPoint, uuid)
                apObject.setCoords(apCoords[0], apCoords[1])
                apObject.setAssetPointsLobesData(largeDirOpen[0], largeDirOpen[1], smallDirOpen[0], smallDirOpen[1])
            else:
                newAp = AssetPoint(apCoords[0], apCoords[1], largeDirOpen[0],
                                   largeDirOpen[1], smallDirOpen[0], smallDirOpen[1])
                self.addAssetPoint(assetPoint, newAp, uuid)

    def updateAntenna(self, antArray: list, uuid: str):
        """
        Update an Antenna object on the GOD class object.

        Args:
            self: GOD object itself
            antArray (list): Array of Antennas objects
            uuid (str): Frontend session UUID
        """
        self.antennas[uuid] = {}

        for antenna in range(len(antArray)):
            antCoords = antArray[antenna]['LongLat']
            dirOpen = antArray[antenna]['DirOpen']
            txPower = antArray[antenna]['TxPower']
            if len(self.antennas[uuid]) > antenna:
                antObject = self.getAntenna(antenna, uuid)
                antObject.setCoords(antCoords[0], antCoords[1])
                antObject.setAntennaLobeData(dirOpen[0],dirOpen[1])
                antObject.setTxPower(txPower[0])
            else:
                newant = Antenna(
                    antCoords[0], antCoords[1], dirOpen[0], dirOpen[1], txPower)
                self.addAntenna(antenna, newant, uuid)

    def updateAnchor(self, anchorArray: list, uuid: str):
        """
        Update an Anchor object on the GOD class object.

        Args:
            self: GOD object itself
            anchorArray (list): Array of Anchors objects
            uuid (str): Frontend session UUID
        """
        self.anchors[uuid] = {}

        for anchor in range(len(anchorArray)):
            anchorCoords = anchorArray[anchor]['LongLat']
            if len(self.anchors[uuid]) > anchor:
                anchorObject = self.getAnchor(anchor, uuid)
                anchorObject.setCoords(anchorCoords[0], anchorCoords[1])
            else:
                newanchor = Anchor(anchorCoords[0], anchorCoords[1])
                self.addAnchor(anchor, newanchor, uuid)

    # setters
    def setStatus(self, status: str, uuid: str):
        """
        setStatus method - Set the current session Status on the GOD class object.

        Args:
            self: GOD object itself
            status (str): The current session status (open/close)
            uuid (str): Frontend session UUID
        """
        self.status[uuid] = status

    def setReadRateParam(self, readRateParam: int, uuid: str):
        """
        Set the Read Rate Parameter on the GOD class object.

        Args:
            self: GOD object itself
            readRateParam (int): The Read Rate Parameter of backend process
            uuid (str): Frontend session UUID
        """
        self.read_rate[uuid] = readRateParam
    
    def setRssiParams(self, rssiParams: dict, uuid: str):
        """
        Set the set of RSSI Parameters on the GOD class object.

        Args:
            self: GOD object itself
            rssiParams (dict): The set of RSSI Parameters
            uuid (str): Frontend session UUID
        """
        self.rssi_params[uuid] = rssiParams

    def setAlgorithms(self, algs: list, uuid: str):
        """
        Set the set of Machine Learning Algorithms on the GOD class object.

        Args:
            self: GOD object itself
            algs (list): The set of Machine Learning Algorithms
            uuid (str): Frontend session UUID
        """
        self.algorithms[uuid] = algs

    def setMapId(self, id: int, uuid: str):
        """
        Set the Map Identification on the GOD class object.

        Args:
            self: GOD object itself
            id (int): The id of the map in use on a session
            uuid (str): Frontend session UUID
        """
        self.mapId[uuid] = id

    def setSessionUUID(self, uuid: str):
        """
        setSessionUUID method - Set the Session UUID on the GOD class object.

        Args:
            self: GOD object itself
            uuid (str): Frontend session UUID
        """
        if self.primarySession == None:
            self.primarySession = uuid

    # getters
    def getAssetPoints(self, uuid: str) -> list:
        """
        Get all the Asset Points on the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            uuid (str): Frontend session UUID
        
        Returns:
            list: All AssetPoints of current session UUID
        """
        return self.assetPoints[uuid]

    def getAssetPoint(self, assetPoint: AssetPoint, uuid: str) -> AssetPoint:
        """
        Get a specific Asset Point from the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            assetPoint (AssetPoint): The Asset Point object 
            uuid (str): Frontend session UUID
        
        Returns: 
            AssetPoint: A specific AssetPoint object from the list of All AssetPoints of the current session UUID
        """
        return self.assetPoints[uuid][assetPoint]

    def getAntennas(self, uuid: str) -> list:
        """
        Get all the Antennas on the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            uuid (str): Frontend session UUID
        
        Returns: 
            list: All Antennas of current session UUID
        """
        return self.antennas[uuid]
    
    def getAntenna(self, antenna: Antenna, uuid: str) -> Antenna:
        """
        Get a specific Antenna from the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            antenna (Antenna): The Antenna object 
            uuid (str): Frontend session UUID
        
        Returns:
            Antenna: A specific Antenna from the list of All Antennas of the current session UUID
        """
        return self.antennas[uuid][antenna]
    
    def getAnchors(self, uuid: str) -> list:
        """
        Get all the Anchors on the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            uuid (str): Frontend session UUID
        
        Returns:
            list: All Anchors of current session UUID
        """
        return self.anchors[uuid]

    def getAnchor(self, anchor: Anchor, uuid: str) -> Anchor:
        """
        Get a specific Anchor from the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            anchor (Anchor): The Anchor object 
            uuid (str): Frontend session UUID
        
        Returns:
            Anchor: A specific Anchor from the list of All Anchors of the current session UUID
        """
        return self.anchors[uuid][anchor]

    def getReadRateParam(self, uuid: str) -> int:
        """
        Get the Read Rate Parameter from the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            uuid (str): Frontend session UUID
        
        Returns:
            int: The Read Rate Parameter of the current session UUID
        """
        return self.read_rate[uuid]

    def getRssiParams(self, uuid: str) -> dict:
        """
        Get the set of RSSI Parameters from the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            uuid (str): Frontend session UUID
        
        Returns:
            dict: The set of RSSI Parameters of the current session UUID
        """
        return self.rssi_params[uuid]

    def getAlgorithms(self, uuid: str) -> list:
        """
        Get the set of Machine Learning Algorithms from the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            uuid (str): Frontend session UUID
        
        Returns:
            list: The set of Machine Learning Algorithms of the current session UUID
        """
        return self.algorithms[uuid]

    def getStatus(self, uuid: str) -> str:
        """
        Get the the current session Status on the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            uuid (str): Frontend session UUID
        
        Returns:
            str: The current session Status of the current session UUID
        """
        return self.status[uuid]

    def getMapId(self, uuid: str) -> int:
        """
        Get the Map Identification on the GOD class object, by the current session UUID.

        Args:
            self: GOD object itself
            uuid (str): Frontend session UUID
        
        Returns:
            int: The id of the map in use of the current session UUID
        """
        return self.mapId[uuid]

    def getSessionUUID(self) -> str:
        """
        Get the current session UUID, on the GOD class object.

        Args:
            self: GOD object itself
        
        Returns:
            str: The UUID in use of the current session
        """
        return self.primarySession
