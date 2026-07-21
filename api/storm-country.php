<?php
header("Content-Type: application/json");

$apiKey = "zpka_d8e0bab014eb4cfe99ecef38863ec244_35472d40";

$country = strtolower($_GET["country"] ?? "");


$countries = [

    "philippines" => [
        "minLat" => 4,
        "maxLat" => 22,
        "minLon" => 116,
        "maxLon" => 127
    ],

    "japan" => [
        "minLat" => 24,
        "maxLat" => 46,
        "minLon" => 123,
        "maxLon" => 146
    ],

    "taiwan" => [
        "minLat" => 21,
        "maxLat" => 26,
        "minLon" => 119,
        "maxLon" => 123
    ]

];


if (!isset($countries[$country])) {

    echo json_encode([
        "error" => "Country not supported"
    ]);

    exit;

}


$area = $countries[$country];


$url = "https://dataservice.accuweather.com/tropical/v1/gov/storms/active";


$ch = curl_init($url);

curl_setopt_array($ch, [

    CURLOPT_RETURNTRANSFER => true,

    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer ".$apiKey,
        "Accept: application/json"
    ]

]);


$response = curl_exec($ch);

curl_close($ch);


$storms = json_decode($response,true);


$result = [];


foreach($storms as $storm){

    if(
        isset($storm["position"]["latitude"]) &&
        isset($storm["position"]["longitude"])
    ){

        $lat = $storm["position"]["latitude"];
        $lon = $storm["position"]["longitude"];


        if(
            $lat >= $area["minLat"] &&
            $lat <= $area["maxLat"] &&
            $lon >= $area["minLon"] &&
            $lon <= $area["maxLon"]
        ){

            $result[] = $storm;

        }

    }

}


echo json_encode($result);
