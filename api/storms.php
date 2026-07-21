<?php

header("Content-Type: application/json");

$apiKey = "zpka_d8e0bab014eb4cfe99ecef38863ec244_35472d40";

$country = strtolower(trim($_GET["country"] ?? ""));


$basins = [

    "philippines" => [
        "id" => "NP",
        "name" => "Northwest Pacific"
    ],

    "japan" => [
        "id" => "NP",
        "name" => "Northwest Pacific"
    ],

    "china" => [
        "id" => "NP",
        "name" => "Northwest Pacific"
    ],

    "taiwan" => [
        "id" => "NP",
        "name" => "Northwest Pacific"
    ],

    "united states" => [
        "id" => "AL",
        "name" => "Atlantic"
    ],

    "mexico" => [
        "id" => "EP",
        "name" => "Eastern Pacific"
    ]

];


if (!isset($basins[$country])) {

    echo json_encode([
        "success" => false,
        "message" => "Unsupported country"
    ]);

    exit;

}


$basin = $basins[$country]["id"];



$url =
"https://dataservice.accuweather.com/tropical/v1/gov/storms/active/"
.$basin
."?apikey="
.urlencode($apiKey);



$ch = curl_init();


curl_setopt_array($ch, [

    CURLOPT_URL => $url,

    CURLOPT_RETURNTRANSFER => true,

    CURLOPT_TIMEOUT => 15,

    CURLOPT_HTTPHEADER => [
        "Accept: application/json"
    ]

]);



$response = curl_exec($ch);

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);



if (curl_errno($ch)) {

    echo json_encode([
        "success"=>false,
        "error"=>curl_error($ch)
    ]);

    curl_close($ch);
    exit;

}


curl_close($ch);



http_response_code($httpCode);


echo $response;
