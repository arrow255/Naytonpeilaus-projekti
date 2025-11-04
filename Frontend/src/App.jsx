// src/App.jsx
import { PinInput, Box, VStack, Button, Text } from "@chakra-ui/react"
import { Link } from "react-router-dom"

//TODO: luo huone näkyviin vasta jos kirjautunut? Jos se on järkevä sillee
function App() {
  return (
    <Box bg="yellow.100" minH="100vh" w="100%">
      {/* kirjautumis ja huoneen luomis napit 
      <VStack spacing={3} align="end" mt={1}>
        <Button 
        as={Link} to="/join_room" 
        colorPalette="teal" 
        size="xl" 
        variant="surface"
        >
          Kirjaudu sisään
        </Button>
      </VStack>
      */}
       <Box p={4} textAlign="center" bgGradient="to-b" gradientFrom="orange.200" gradientTo="yellow.100">
        <Text fontSize="5xl" fontWeight="bold">
          Jaa näyttösi helposti!
        </Text>
      </Box>
        

      <Box display="flex" justifyContent="center" alignItems="center" minHeight="48vh">
        
        
        <VStack spacing={7} align="center">
          {/* pin koodi paikka
          <Box width="100%" padding="4" color="black" fontSize="3xl">
            Liity opettajan huoneeseen syöttämällä liittymiskoodi:
          </Box>
          
           
          <PinInput.Root type="alphanumeric" placeholder="" >
            <PinInput.HiddenInput />
            <PinInput.Control>
              <PinInput.Input index={0} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black" />
              <Box padding="2"></Box>
              <PinInput.Input index={1} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black"/>
              <Box padding="4" fontSize="5xl" lineHeight="40px">-</Box>
              <PinInput.Input index={2} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black"/>
              <Box padding="2"></Box>
              <PinInput.Input index={3} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black"/>
            </PinInput.Control>
          </PinInput.Root>
          
          <Box padding="4" color="black" fontSize="3xl" justifyContent="center" alignItems="center">
            TAI
          </Box>
          */}
          <Button 
          as={Link} to="/create_room" 
          colorPalette="teal" 
          variant="surface"
          fontSize = {30}
          px={20}
          py={10}
          > 
            Luo huone   
          </Button>
          
          <Button 
          as={Link} to="/join_room" 
          colorPalette="teal" 
          fontSize = {30}
          px={10}
          py={10} 
          variant="surface"
          >
            Kirjaudu sisään
          </Button>
        </VStack>
      </Box>
    </Box>
  )
}

export default App
